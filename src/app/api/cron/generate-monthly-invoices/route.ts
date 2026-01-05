// Monthly Invoicing Cron Job
// Path: /api/cron/generate-monthly-invoices
// Triggered by Vercel Cron or manually

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createInvoice } from '@/lib/db/supabase';
import { zoho } from '@/lib/invoicing/zoho';
import type { Client, Subscription, OneTimeCharge } from '@/lib/db/types';

export const maxDuration = 300; // 5 minutes max

export async function GET(request: NextRequest) {
    // Check for Authorization header if using Vercel Cron
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new Response('Unauthorized', { status: 401 });
    // }

    try {
        console.log('Starting monthly invoicing generation...');
        const results = {
            processed: 0,
            invoices_created: 0,
            errors: 0,
            details: [] as string[]
        };

        const today = new Date();
        const currentMonthName = today.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

        // 1. Get all active clients
        const { data: clients, error: clientError } = await supabaseAdmin.select<Client>(
            'clients',
            "status=eq.active"
        );

        if (clientError || !clients) {
            throw new Error('Failed to fetch clients: ' + clientError?.message);
        }

        console.log(`Found ${clients.length} active clients.`);

        for (const client of clients) {
            try {
                // 2. Get active subscriptions
                const { data: subscriptions } = await supabaseAdmin.select<Subscription>(
                    'subscriptions',
                    `client_id=eq.${client.id}&status=eq.active`
                );

                // 3. Get pending one-time charges
                const { data: oneTimeCharges } = await supabaseAdmin.select<OneTimeCharge>(
                    'one_time_charges',
                    `client_id=eq.${client.id}&invoiced=eq.false`
                );

                const hasSubscriptions = subscriptions && subscriptions.length > 0;
                const hasCharges = oneTimeCharges && oneTimeCharges.length > 0;

                if (!hasSubscriptions && !hasCharges) {
                    continue; // Nothing to invoice
                }

                results.processed++;
                const lineItems: any[] = [];
                let subtotal = 0;

                // Add Subscriptions
                if (hasSubscriptions) {
                    for (const sub of subscriptions!) {
                        // Skip variable subscriptions (0 monthly amount) - they are handled via OneTimeCharges from reports
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

                // Add One-Time Charges (including prorations)
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

                // 4. Get or Create Zoho Contact
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
                    notes: `Facture mensuelle globale - ${currentMonthName}`,
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
                    status: 'sent', // Assuming sent via automation or to be sent
                    external_id: zohoInvoice.invoice_id,
                    external_provider: 'zoho',
                    gocardless_payment_id: null,
                    issued_at: new Date().toISOString(),
                    due_at: dueDate.toISOString(),
                    paid_at: null,
                });

                // 7. Mark one-time charges as invoiced
                if (hasCharges && localInvoice) {
                    const chargeIds = oneTimeCharges!.map(c => c.id);
                    // Update in batches or loop
                    for (const cid of chargeIds) {
                        await supabaseAdmin.update('one_time_charges', `id=eq.${cid}`, {
                            invoiced: true,
                            invoice_id: localInvoice.id
                        });
                    }
                }

                results.invoices_created++;
                results.details.push(`Created invoice ${zohoInvoice.invoice_number} for ${client.company_name} (${totalTtc.toFixed(2)}€)`);

            } catch (invoiceError: any) {
                console.error(`Failed to invoice client ${client.id}:`, invoiceError);
                results.errors++;
                results.details.push(`Error for ${client.company_name}: ${invoiceError.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Monthly invoicing completed',
            results
        });

    } catch (error: any) {
        console.error('Monthly invoicing cron error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
