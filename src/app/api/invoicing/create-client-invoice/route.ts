// Create Client Invoice API
// POST /api/invoicing/create-client-invoice

import { NextRequest, NextResponse } from 'next/server';
import { zoho } from '@/lib/invoicing/zoho';
import { supabaseAdmin, getClientById, createInvoice } from '@/lib/db/supabase';
import type { Client } from '@/lib/db/types';

interface InvoiceItem {
    description: string;
    amount: number;
    vatRate?: number; // Add optional vatRate
    source: 'subscription' | 'one_time' | 'manual';
    sourceId?: string;
}

/**
 * Determine VAT rate based on client's VAT number.
 * - If VAT number exists, is valid EU format, and is NOT Luxembourgish (LU), apply 0% (reverse charge).
 * - Otherwise, apply the standard Luxembourg VAT rate of 17%.
 */
function getClientVatRate(client: Client): number {
    if (client.vat_number && client.vat_number.trim().length > 0) {
        // Clean and validate VAT format
        const cleaned = client.vat_number.trim().toUpperCase().replace(/\s+/g, '');

        // Check for valid EU VAT format: 2 letters + 2-12 alphanumeric chars
        const euVatRegex = /^[A-Z]{2}[0-9A-Z]{2,12}$/;
        if (!euVatRegex.test(cleaned)) {
            // Invalid format, use standard rate
            return 17;
        }

        const vatPrefix = cleaned.substring(0, 2);
        if (vatPrefix !== 'LU') {
            // Valid non-LU EU VAT -> Intra-community -> 0%
            return 0;
        }
    }
    // Luxembourg client or no valid VAT number -> Standard 17%
    return 17;
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

        // Determine default VAT rate for this client
        const defaultVatRate = getClientVatRate(client);
        const isReverseCharge = defaultVatRate === 0;
        console.log(`Client ${client.company_name}: Default VAT = ${defaultVatRate}%${isReverseCharge ? ' (Reverse Charge)' : ''}`);

        // 2. Calculate totals
        let subtotal = 0;
        let vatAmount = 0;

        for (const item of items) {
            subtotal += item.amount;
            // Use item-specific VAT if provided, otherwise use client's default
            const itemVatRate = item.vatRate !== undefined ? item.vatRate : defaultVatRate;
            vatAmount += item.amount * (itemVatRate / 100);
        }

        const total = subtotal + vatAmount;
        // Average VAT rate for local DB (informative only)
        const avgVatRate = subtotal > 0 ? parseFloat(((vatAmount / subtotal) * 100).toFixed(2)) : 0;

        // 3. Get or create Zoho contact
        const contact = await zoho.getOrCreateContact({
            company_name: client.company_name,
            contact_name: client.contact_name,
            email: client.email,
            address: client.address || undefined,
            city: client.city || undefined,
            postal_code: client.postal_code || undefined,
            country: client.country || 'Luxembourg',
            vat_number: client.vat_number || undefined,
        });

        // 4. Create invoice in Zoho
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15); // Net 15

        // Add reverse charge note if applicable
        let invoiceNotes = `Facture mensuelle - ${client.company_name}`;
        if (isReverseCharge) {
            invoiceNotes += `\n\nTVA non applicable - Autoliquidation (Reverse Charge). Article 44 de la directive 2006/112/CE.`;
        }

        const { invoice: zohoInvoice } = await zoho.createInvoice({
            customer_id: contact.contact_id,
            date: new Date().toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            notes: invoiceNotes,
            terms: 'Paiement à 15 jours.',
            is_draft: true, // Draft
            line_items: items.map(item => ({
                name: item.description,
                description: item.source === 'subscription' ? 'Abonnement mensuel' :
                    item.source === 'one_time' ? 'Service ponctuel' : '',
                rate: item.amount,
                quantity: 1,
                tax_percentage: item.vatRate !== undefined ? item.vatRate : defaultVatRate, // Use client default
            })),
        });

        // 5. Save invoice to local database
        const localInvoice = await createInvoice({
            client_id,
            invoice_number: zohoInvoice.invoice_number,
            subtotal: subtotal,
            vat_rate: avgVatRate, // Use the calculated average
            vat_amount: vatAmount,
            total: total,

            status: 'draft', // Draft status
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
