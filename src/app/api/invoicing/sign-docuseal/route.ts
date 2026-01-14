
import { NextRequest, NextResponse } from 'next/server';
import { docuSeal } from '@/lib/docuseal';
import { supabaseAdmin, getClientByEmail, createClient as createClientDb } from '@/lib/db/supabase';

// POST /api/invoicing/sign-docuseal
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { pdf_base64, client_email, client_name, client_company, client_phone, quote_number, quote_data, field_overrides, clientAddress, vatNumber } = body;

        if (!pdf_base64 || !client_email) {
            return NextResponse.json(
                { error: 'Missing PDF or Client Email' },
                { status: 400 }
            );
        }

        console.log(`Initiating DocuSeal Session for Quote ${quote_number} (${client_email})...`);

        // 1. Always create new client (User Request)
        console.log(`Creating new client for Quote ${quote_number}`);

        let clientId: string;

        // Create new client
        try {
            const newClient = await createClientDb({
                company_name: client_company || client_name || 'Nouveau Client',
                contact_name: client_name || 'Contact',
                email: client_email,
                phone: client_phone || null,
                address: clientAddress || null,
                city: null,
                postal_code: null,
                status: 'active',
                client_type: 'new',
                country: 'Luxembourg',
                vat_number: vatNumber || null,
                cancellation_requested_at: null,
                cancellation_effective_at: null,
                cancellation_reason: null,
                cancellation_signed_at: null,
                sepa_exception: false,
                sepa_exception_reason: null,
                notes: null,
                commission_config: null,
                zoho_contact_id: null,
                payment_method: 'manual',
            });
            clientId = newClient.id;
        } catch (error: any) {
            // Handle duplicate email constraint (23505)
            if (error?.code === '23505' || error?.message?.includes('clients_email_key')) {
                console.log('Email exists, creating with suffix...');
                // Append timestamp to email to make it unique
                const timestamp = Date.now().toString().slice(-4);
                const [local, domain] = client_email.split('@');
                const newEmail = `${local}+${timestamp}@${domain}`;

                const newClient = await createClientDb({
                    company_name: client_company || client_name || 'Nouveau Client',
                    contact_name: client_name || 'Contact',
                    email: newEmail,
                    phone: client_phone || null,
                    address: clientAddress || null,
                    city: null,
                    postal_code: null,
                    status: 'active',
                    client_type: 'new',
                    country: 'Luxembourg',
                    vat_number: vatNumber || null,
                    cancellation_requested_at: null,
                    cancellation_effective_at: null,
                    cancellation_reason: null,
                    cancellation_signed_at: null,
                    sepa_exception: false,
                    sepa_exception_reason: null,
                    notes: null,
                    commission_config: null,
                    zoho_contact_id: null,
                    payment_method: 'manual',
                });
                clientId = newClient.id;
            } else {
                throw error;
            }
        }
        console.log(`Created new client: ${client_company || client_name} (ID: ${clientId})`);

        // 2. Create quote record in database
        // Build items array for storage
        const allItems = [
            ...(quote_data?.monthlyItems || []).map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total: item.unitPrice * item.quantity,
                is_recurring: true
            })),
            ...(quote_data?.oneTimeItems || []).map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total: item.unitPrice * item.quantity,
                is_recurring: false
            }))
        ];

        console.log(`Saving quote with ${allItems.length} items (${quote_data?.monthlyItems?.length || 0} monthly, ${quote_data?.oneTimeItems?.length || 0} one-time)`);

        // Check if quote exists
        const { data: existingQuote } = await supabaseAdmin.selectOne<any>('quotes', `quote_number=eq.${quote_number}`);

        let quoteError;

        if (existingQuote) {
            console.log(`Quote ${quote_number} exists, updating with new client ${clientId}...`);
            const { error } = await supabaseAdmin.update('quotes', `quote_number=eq.${quote_number}`, {
                client_id: clientId,
                client_name: client_name,
                client_email: client_email,
                client_company: client_company || client_name,
                items: allItems,
                subtotal: quote_data?.subtotal || 0,
                vat_rate: quote_data?.vatRate || 17,
                vat_amount: quote_data?.vatAmount || 0,
                total: quote_data?.totalTtc || 0,
                discount_percent: quote_data?.discountPercent || 0,
                discount_amount: quote_data?.discountAmount || 0,
                has_recurring: quote_data?.monthlyTotal > 0,
                status: 'sent',
                valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });
            quoteError = error;
        } else {
            console.log(`Quote ${quote_number} does not exist, creating...`);
            const { error } = await supabaseAdmin.insert('quotes', {
                quote_number: quote_number,
                client_id: clientId,
                client_name: client_name,
                client_email: client_email,
                client_company: client_company || client_name,
                items: allItems,
                subtotal: quote_data?.subtotal || 0,
                vat_rate: quote_data?.vatRate || 17,
                vat_amount: quote_data?.vatAmount || 0,
                total: quote_data?.totalTtc || 0,
                discount_percent: quote_data?.discountPercent || 0,
                discount_amount: quote_data?.discountAmount || 0,
                has_recurring: quote_data?.monthlyTotal > 0,
                status: 'sent',
                valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });
            quoteError = error;
        }

        if (quoteError) {
            console.error('Failed to create/update quote:', quoteError);
            throw new Error(`Failed to save quote: ${quoteError.message}`); // Throw to stop execution
        } else {
            console.log(`Quote ${quote_number} saved/updated in database linked to client ${clientId}`);
        }

        // Helper to calculate proration
        function calculateProration(monthlyAmount: number, startDateStr: string) {
            const today = new Date();
            const startDate = new Date(startDateStr);
            if (startDate.getMonth() !== today.getMonth() || startDate.getFullYear() !== today.getFullYear()) return null;
            if (startDate.getDate() === 1) return null;
            const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
            const daysInMonth = endOfMonth.getDate();
            const daysActive = daysInMonth - startDate.getDate() + 1;
            return {
                amount: Math.round((monthlyAmount / daysInMonth) * daysActive * 100) / 100,
                days: daysActive,
                totalDays: daysInMonth
            };
        }

        // 3. Create Subscriptions from Monthly Items
        if (quote_data?.monthlyItems && Array.isArray(quote_data.monthlyItems) && quote_data.monthlyItems.length > 0) {
            console.log(`Creating ${quote_data.monthlyItems.length} subscriptions for client ${clientId}...`);

            // Parse startDate format: 'current-full', 'next-half', etc.
            const today = new Date();
            const startModeRaw = quote_data.startDate || 'current-full';
            const parts = startModeRaw.split('-');
            const monthPart = parts[0] || 'current';
            const dayPart = parts[1] || 'full';

            let monthOffset = 0;
            if (monthPart === 'next') monthOffset = 1;
            else if (monthPart === 'next2') monthOffset = 2;

            const day = dayPart === 'half' ? 15 : 1;
            const startDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, day);
            const startedAt = startDate.toISOString().split('T')[0];

            console.log(`Subscription start date: ${startedAt} (mode: ${startModeRaw})`);

            for (const item of quote_data.monthlyItems) {
                // Determine Service Type from description
                let serviceType = 'other';
                const lowerDesc = (item.description || '').toLowerCase();
                if (lowerDesc.includes('hébergement') || lowerDesc.includes('hosting')) serviceType = 'hosting';
                else if (lowerDesc.includes('commande') || lowerDesc.includes('ordering')) serviceType = 'online_ordering';
                else if (lowerDesc.includes('réservation') || lowerDesc.includes('reservation')) serviceType = 'table_reservation';
                else if (lowerDesc.includes('site') || lowerDesc.includes('web')) serviceType = 'website';
                else if (lowerDesc.includes('maintenance')) serviceType = 'maintenance';

                const monthlyAmt = item.unitPrice * item.quantity;

                console.log(`  -> Creating subscription: ${item.description} (${monthlyAmt}€/mois, type: ${serviceType})`);

                const { error: subError } = await supabaseAdmin.insert('subscriptions', {
                    client_id: clientId,
                    service_type: serviceType,
                    service_name: item.description,
                    description: item.description,
                    monthly_amount: monthlyAmt,
                    commission_percent: 0,
                    status: 'active',
                    started_at: startedAt,
                    cancelled_at: null
                });

                if (subError) {
                    console.error(`  ❌ Failed to create subscription: ${subError.message}`);
                } else {
                    console.log(`  ✅ Subscription created: ${item.description}`);
                }

                // Calculate Prorata
                const proration = calculateProration(monthlyAmt, startedAt);
                if (proration && proration.amount > 0) {
                    await supabaseAdmin.insert('one_time_charges', {
                        client_id: clientId,
                        description: `Prorata ${item.description} (${proration.days}/${proration.totalDays} jours)`,
                        amount: proration.amount,
                        invoiced: false,
                        invoice_id: null
                    });
                }
            }
            console.log(`Finished creating subscriptions for client ${clientId}`);
        } else {
            console.log(`No monthly items to process (monthlyItems: ${JSON.stringify(quote_data?.monthlyItems)})`);
        }

        // 4. Create One-Time Charges
        if (quote_data?.oneTimeItems && Array.isArray(quote_data.oneTimeItems)) {
            console.log(`Processing ${quote_data.oneTimeItems.length} one-time items...`);
            for (const item of quote_data.oneTimeItems) {
                await supabaseAdmin.insert('one_time_charges', {
                    client_id: clientId,
                    description: item.description,
                    amount: item.unitPrice * item.quantity,
                    invoiced: false, // Mark as pending invoicing
                    invoice_id: null
                });
            }
        }

        // 5. Create DocuSeal submission
        // Use environment variable for base URL (Vercel compatible)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        const submission = await docuSeal.initSigningSession({
            email: client_email,
            name: client_name || 'Client',
            documents: [{
                name: `Devis_${quote_number}.pdf`,
                file: pdf_base64,
            }],
            redirect_url: `${baseUrl}/quote/${quote_number}/success`,
            field_overrides: field_overrides
        });

        console.log('DocuSeal Submission Response:', submission);

        const signingUrl = submission[0]?.embed_src || `https://docuseal.eu/s/${submission[0]?.slug}`;
        const slug = submission[0]?.slug || submission.slug;

        if (!signingUrl && !slug) {
            throw new Error('No signing URL or slug returned from DocuSeal');
        }

        // Store slug in quote for status verification (fallback for webhook)
        if (slug) {
            await supabaseAdmin.update('quotes', `quote_number=eq.${quote_number}`, {
                signature_data: JSON.stringify({ slug: slug })
            });
        }

        return NextResponse.json({
            success: true,
            url: signingUrl,
            slug: slug,
            client_id: clientId
        });

    } catch (error) {
        console.error('DocuSeal API Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'DocuSeal failed' },
            { status: 500 }
        );
    }
}
