
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { zoho } from '@/lib/invoicing/zoho';
import type { Invoice } from '@/lib/db/types';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// Sync invoices status with Zoho for a client
// GET /api/clients/[id]/sync-invoices
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: clientId } = await params;

        // 1. Get local invoices that are not paid or cancelled, and have an external ID
        // Note: filtering by client_id and status
        const { data: invoices, error } = await supabaseAdmin.select<Invoice>(
            'invoices',
            `client_id=eq.${clientId}&status=neq.paid&status=neq.cancelled&external_provider=eq.zoho`
        );

        if (error) {
            console.error('Sync error fetching local invoices:', error);
            throw new Error(error.message);
        }

        console.log(`Syncing ${invoices?.length || 0} invoices for client ${clientId}`);

        if (!invoices || invoices.length === 0) {
            return NextResponse.json({ success: true, synced: 0 });
        }

        let syncedCount = 0;
        const updates: any[] = [];

        // 2. Check status in Zoho for each invoice
        for (const invoice of invoices) {
            if (!invoice.external_id) {
                console.warn(`Invoice ${invoice.invoice_number} has no external_id, skipping sync.`);
                continue;
            }

            try {
                const { invoice: zohoInvoice } = await zoho.getInvoice(invoice.external_id);

                console.log(` Invoice ${invoice.invoice_number}: Local=${invoice.status} / Zoho=${zohoInvoice.status}`);

                let newStatus = invoice.status;
                let paidAt = invoice.paid_at;

                // Configure mapping
                // Zoho statuses: draft, sent, viewed, paid, overdue, void, partially_paid

                if (zohoInvoice.status === 'paid') {
                    newStatus = 'paid';
                    // Try to guess payment date or set today
                    paidAt = new Date().toISOString();
                } else if (zohoInvoice.status === 'void') {
                    newStatus = 'cancelled';
                } else if (['sent', 'viewed', 'overdue', 'partially_paid'].includes(zohoInvoice.status)) {
                    // If local is draft but remote is sent/viewed/etc
                    if (invoice.status === 'draft') {
                        newStatus = 'sent';
                    }
                } else if (zohoInvoice.status === 'draft') {
                    // If Zoho is draft, we force draft locally (e.g. if it was sent by mistake locally)
                    newStatus = 'draft';
                }

                if (newStatus !== invoice.status) {
                    console.log(`  -> Updating status to ${newStatus}`);
                    await supabaseAdmin.update('invoices', `id=eq.${invoice.id}`, {
                        status: newStatus,
                        paid_at: paidAt
                    });
                    syncedCount++;
                    updates.push({ id: invoice.id, old: invoice.status, new: newStatus });
                }
            } catch (err: any) {
                console.error(`Failed to sync invoice ${invoice.invoice_number} (ExtID: ${invoice.external_id}):`, err.message);
            }
        }

        return NextResponse.json({ success: true, synced: syncedCount, updates });

    } catch (error: any) {
        console.error('Sync invoices error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
