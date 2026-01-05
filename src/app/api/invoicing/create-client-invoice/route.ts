// Create Client Invoice API
// POST /api/invoicing/create-client-invoice

import { NextRequest, NextResponse } from 'next/server';
import { zoho } from '@/lib/invoicing/zoho';
import { supabaseAdmin, getClientById, createInvoice } from '@/lib/db/supabase';

interface InvoiceItem {
    description: string;
    amount: number;
    source: 'subscription' | 'one_time' | 'manual';
    sourceId?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { client_id, items } = body as { client_id: string; items: InvoiceItem[] };

        if (!client_id || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Client ID and items are required' },
                { status: 400 }
            );
        }

        // 1. Get client details
        const client = await getClientById(client_id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // 2. Calculate totals
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const vatRate = 17;
        const vatAmount = subtotal * (vatRate / 100);
        const total = subtotal + vatAmount;

        // 3. Get or create Zoho contact
        const contact = await zoho.getOrCreateContact({
            company_name: client.company_name,
            contact_name: client.contact_name,
            email: client.email,
        });

        // 4. Create invoice in Zoho
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15); // Net 15

        const { invoice: zohoInvoice } = await zoho.createInvoice({
            customer_id: contact.contact_id,
            date: new Date().toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            notes: `Facture mensuelle - ${client.company_name}`,
            terms: 'Paiement à 15 jours.',
            is_draft: false,
            line_items: items.map(item => ({
                name: item.description,
                description: item.source === 'subscription' ? 'Abonnement mensuel' :
                    item.source === 'one_time' ? 'Service ponctuel' : '',
                rate: item.amount,
                quantity: 1,
                tax_percentage: vatRate,
            })),
        });

        // 5. Save invoice to local database
        const localInvoice = await createInvoice({
            client_id,
            invoice_number: zohoInvoice.invoice_number,
            subtotal: subtotal,
            vat_rate: vatRate,
            vat_amount: vatAmount,
            total: total,

            status: 'sent',
            external_id: zohoInvoice.invoice_id,
            external_provider: 'zoho',
            gocardless_payment_id: null,
            issued_at: new Date().toISOString(),
            due_at: dueDate.toISOString(),
            paid_at: null,
            period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
            period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
        });

        // 6. Mark one-time charges as invoiced
        const oneTimeChargeIds = items
            .filter(item => item.source === 'one_time' && item.sourceId)
            .map(item => item.sourceId);

        if (oneTimeChargeIds.length > 0) {
            for (const chargeId of oneTimeChargeIds) {
                await supabaseAdmin.update('one_time_charges', `id=eq.${chargeId}`, {
                    invoiced: true,
                    invoice_id: localInvoice.id,
                });
            }
        }

        console.log(`Created invoice ${zohoInvoice.invoice_number} for client ${client.company_name}`);

        return NextResponse.json({
            success: true,
            invoice_id: localInvoice.id,
            zoho_invoice_id: zohoInvoice.invoice_id,
            invoice_number: zohoInvoice.invoice_number,
            total: total,
        });

    } catch (error) {
        console.error('Create client invoice error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create invoice' },
            { status: 500 }
        );
    }
}
