
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createInvoice } from '@/lib/db/supabase';
import { zoho } from '@/lib/invoicing/zoho';
import type { Client, Subscription, OneTimeCharge } from '@/lib/db/types';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Correct Next.js 15+ params type
) {
    const { id: clientId } = await context.params;

    try {
        console.log(`Generating manual invoice for client ${clientId}...`);

        // 1. Fetch Client
        const { data: client, error: clientError } = await supabaseAdmin.selectOne<Client>(
            'clients',
            `id=eq.${clientId}`
        );

        if (clientError || !client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const today = new Date();
        const currentMonthName = today.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

        // 2. Fetch Active Subscriptions
        const { data: subscriptions } = await supabaseAdmin.select<Subscription>(
            'subscriptions',
            `client_id=eq.${clientId}&status=eq.active`
        );

        // 3. Fetch Pending One-Time Charges
        const { data: oneTimeCharges } = await supabaseAdmin.select<OneTimeCharge>(
            'one_time_charges',
            `client_id=eq.${clientId}&invoiced=eq.false`
        );

        const hasSubscriptions = subscriptions && subscriptions.length > 0;
        const hasCharges = oneTimeCharges && oneTimeCharges.length > 0;

        if (!hasSubscriptions && !hasCharges) {
            return NextResponse.json({ error: 'No items to invoice (no active subscriptions or pending charges)' }, { status: 400 });
        }

        const lineItems: any[] = [];
        let subtotal = 0;

        // Add Subscriptions
        if (hasSubscriptions) {
            for (const sub of subscriptions!) {
                // Skip variable subscriptions (0 monthly amount)
                if (sub.monthly_amount <= 0) continue;

                lineItems.push({
                    name: sub.service_name || sub.service_type,
                    description: `Abonnement mensuel - ${currentMonthName}`,
                    rate: sub.monthly_amount,
                    quantity: 1,
                    tax_percentage: 17 // Default VAT
                });
                subtotal += sub.monthly_amount;
            }
        }

        // Add One-Time Charges
        if (hasCharges) {
            for (const charge of oneTimeCharges!) {
                lineItems.push({
                    name: charge.description,
                    description: 'Service ponctuel / Ajustement',
                    rate: charge.amount,
                    quantity: 1,
                    tax_percentage: 17 // Default VAT
                });
                subtotal += charge.amount;
            }
        }

        if (lineItems.length === 0) {
            return NextResponse.json({ error: 'Invoice amount is 0 (Subscriptions are 0€ and no charges)' }, { status: 400 });
        }

        // 4. Get/Create Zoho Contact
        const contact = await zoho.getOrCreateContact({
            company_name: client.company_name,
            contact_name: client.contact_name,
            email: client.email,
            address: client.address || undefined,
            vat_number: client.vat_number || undefined,
        });

        // 5. Create Zoho Invoice
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15); // Net 15

        const { invoice: zohoInvoice } = await zoho.createInvoice({
            customer_id: contact.contact_id,
            date: today.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            notes: `Facture générée manuellement - ${currentMonthName}`,
            terms: 'Paiement à 15 jours par prélèvement ou virement.',
            line_items: lineItems,
        });

        // 6. Save Invoice to Local DB
        const vatAmount = subtotal * 0.17;
        const totalTtc = subtotal + vatAmount;

        const localInvoice = await createInvoice({
            client_id: client.id,
            invoice_number: zohoInvoice.invoice_number,
            subtotal: subtotal,
            vat_rate: 17,
            vat_amount: vatAmount,
            total: totalTtc,
            status: 'sent',
            external_id: zohoInvoice.invoice_id,
            external_provider: 'zoho',
            gocardless_payment_id: null,
            issued_at: new Date().toISOString(),
            due_at: dueDate.toISOString(),
            paid_at: null,
            period_start: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
            period_end: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString(),
        });

        // 7. Mark one-time charges as invoiced
        if (hasCharges && localInvoice) {
            const chargeIds = oneTimeCharges!.map(c => c.id);
            for (const cid of chargeIds) {
                await supabaseAdmin.update('one_time_charges', `id=eq.${cid}`, {
                    invoiced: true,
                    invoice_id: localInvoice.id
                });
            }
        }

        return NextResponse.json({
            success: true,
            invoice: localInvoice,
            zoho_number: zohoInvoice.invoice_number
        });

    } catch (error: any) {
        console.error('Manual generation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
