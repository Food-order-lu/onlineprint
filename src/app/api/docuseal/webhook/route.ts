import { NextRequest, NextResponse } from 'next/server';
import {
    createDepositInvoiceOnQuoteSign,
    zoho
} from '@/lib/invoicing/zoho';
import {
    getQuoteByNumber,
    getClientById,
    updateClient,
    supabaseAdmin
} from '@/lib/db/supabase';
import { docuSeal } from '@/lib/docuseal';

// POST /api/docuseal/webhook
// POST /api/docuseal/webhook
export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();

        // Check for 'submission.completed' event
        if (payload.event_type !== 'submission.completed') {
            return NextResponse.json({ message: 'Event ignored' });
        }

        const submission = payload.data;
        const documents = submission.documents || [];

        console.log(`DocuSeal Submission Completed: ${submission.id}`);

        for (const doc of documents) {
            // Document name format: Devis_DEV-202601-123.pdf
            const filename = doc.name;
            const match = filename.match(/Devis_(DEV-\d+-\d+)/);

            if (match && match[1]) {
                const quoteNumber = match[1];
                console.log(`Processing signed quote: ${quoteNumber}`);

                // 1. Find Quote in Supabase
                const quote = await getQuoteByNumber(quoteNumber);
                if (!quote) {
                    console.error(`Quote not found in DB: ${quoteNumber}`);
                    continue;
                }

                if (!quote.client_id) {
                    console.error(`Quote ${quoteNumber} has no linked client_id`);
                    continue;
                }

                const client = await getClientById(quote.client_id);
                if (!client) {
                    console.error(`Client not found for quote ${quoteNumber}`);
                    continue;
                }

                // 2. Create Contract Record
                const { error: contractError } = await supabaseAdmin.insert('contracts', {
                    client_id: client.id,
                    quote_id: quote.id,
                    document_url: doc.url, // URL to signed PDF
                    status: 'signed',
                    signed_at: new Date().toISOString(),
                    valid_from: new Date().toISOString(),
                    // valid_until: calculateValidity(quote)... default 1 year?
                });

                if (contractError) {
                    console.error('Failed to create contract record:', contractError);
                } else {
                    console.log('Contract record created in DB');
                }

                // 3. Update Client Status -> active
                if (['prospect', 'pending_confirmation'].includes(client.status)) {
                    await updateClient(client.id, { status: 'active' });
                    console.log(`Client ${client.company_name} updated to active`);
                }

                // 4. Send Email Notifications
                try {
                    const { sendEmail } = await import('@/lib/email/client');
                    const { EmailTemplates } = await import('@/lib/email/templates');

                    // Email to Client
                    await sendEmail({
                        to: client.email,
                        subject: `Votre devis signé : ${quoteNumber}`,
                        html: EmailTemplates.QuoteSigned(
                            client.contact_name,
                            quoteNumber,
                            `https://rivego.lu/quote/${quote.id}/success`
                        )
                    });

                    // Email to Admin
                    await sendEmail({
                        to: 'contact@rivego.lu', // Admin email
                        subject: `[ADMIN] Devis signé : ${client.company_name}`,
                        html: `<p>Le client ${client.company_name} a signé le devis ${quoteNumber}.</p><p><a href="${doc.url}">Voir le document signé</a></p>`
                    });

                    console.log(`Emails sent for quote ${quoteNumber}`);
                } catch (emailErr) {
                    console.error('Failed to send emails:', emailErr);
                }

                // 5. AUTO-CREATE SUBSCRIPTIONS & CHARGES from quote items
                let subscriptionsCreated = 0;
                let chargesCreated = 0;
                if (quote.items && Array.isArray(quote.items)) {
                    try {
                        const { createSubscription } = await import('@/lib/db/supabase');
                        for (const item of quote.items) {
                            if ((item as any).is_recurring) {
                                await createSubscription({
                                    client_id: client.id,
                                    service_type: ((item as any).service_type || 'other') as any,
                                    service_name: item.description,
                                    description: `Créé automatiquement (Signature Devis ${quoteNumber})`,
                                    monthly_amount: item.total,
                                    commission_percent: 0,
                                    status: 'active',
                                    started_at: new Date().toISOString().split('T')[0],
                                    cancelled_at: null,
                                });
                                subscriptionsCreated++;
                            } else {
                                // Add as one-time charge
                                await supabaseAdmin.insert('one_time_charges', {
                                    client_id: client.id,
                                    description: item.description,
                                    amount: item.total,
                                    invoiced: true, // They will be invoiced by the Zoho Deposit Invoice (20%) or separate invoice
                                });
                                chargesCreated++;
                            }
                        }
                        console.log(`Created ${subscriptionsCreated} subscriptions and ${chargesCreated} charges from quote ${quoteNumber}`);
                    } catch (subError) {
                        console.error('Failed to auto-create subscriptions/charges:', subError);
                    }
                }

                // 6. Create Deposit Invoice (20%) in Zoho
                // Only if quote total > 0 via Zoho helper
                if (quote.total > 0) {
                    try {
                        const { createDepositInvoiceOnQuoteSign } = await import('@/lib/invoicing/zoho');
                        await createDepositInvoiceOnQuoteSign({
                            client: {
                                email: client.email,
                                company_name: client.company_name,
                                contact_name: client.contact_name,
                                address: client.address || undefined,
                                city: client.city || undefined,
                                postal_code: client.postal_code || undefined,
                                vat_number: client.vat_number || undefined,
                            },
                            quote_number: quoteNumber,
                            quote_total: quote.total,
                            deposit_percent: 20, // Default to 20%
                            services_description: quote.items.map((i: any) => i.description).join(', '),
                        });
                        console.log('Deposit invoice created in Zoho');
                    } catch (zohoError) {
                        console.error('Zoho Deposit Invoice Failed:', zohoError);
                    }
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DocuSeal Webhook Error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
