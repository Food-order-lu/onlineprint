// Quote Signature & Project Initiation API
// Path: /api/quotes/[number]/sign

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getClientByEmail, createClient as createClientDb } from '@/lib/db/supabase';

interface RouteParams {
    params: Promise<{ number: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { number } = await params;
        const body = await request.json();
        const { signatureData, quoteData } = body;

        if (!signatureData || !quoteData) {
            return NextResponse.json({ error: 'Missing signature or quote data' }, { status: 400 });
        }

        // 1. Check if client already exists by email
        let clientId: string;
        const existingClient = await getClientByEmail(quoteData.clientEmail);

        if (existingClient) {
            // Client exists - use their ID
            clientId = existingClient.id;
        } else {
            // Create new client with status "pending_confirmation"
            // The admin must confirm before tasks are created
            const newClient = await createClientDb({
                company_name: quoteData.clientCompany,
                contact_name: quoteData.clientName,
                email: quoteData.clientEmail,
                phone: quoteData.clientPhone || null,
                address: quoteData.clientAddress || null,
                city: null,
                postal_code: null,
                status: 'pending_confirmation', // <-- Waiting for admin confirmation
                client_type: 'new',
                country: 'Luxembourg',
                vat_number: quoteData.clientVat || null,
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
                referral_code: null,
                referred_by: null,
            });

            clientId = newClient.id;
        }

        // 2. Save quote with signature
        const { data: quote, error: quoteError } = await supabaseAdmin.insert('quotes', {
            quote_number: number,
            client_id: clientId,
            client_name: quoteData.clientName,
            client_email: quoteData.clientEmail,
            client_company: quoteData.clientCompany,
            subtotal: quoteData.subtotal || 0,
            vat_rate: quoteData.vatRate || 17,
            vat_amount: quoteData.vatAmount || 0,
            total: quoteData.totalTtc || 0,
            discount_percent: quoteData.discountPercent || 0,
            discount_amount: quoteData.discountAmount || 0,
            has_recurring: quoteData.monthlyTotal > 0,
            status: 'signed',
            signed_at: new Date().toISOString(),
            signature_data: signatureData,
            signer_ip: request.headers.get('x-forwarded-for') || 'unknown',
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        if (quoteError) {
            console.error('Quote save error:', quoteError);
            // Don't fail entirely - client was created
        }

        // 3. Create a task for admin to confirm this new client
        // NO automatic project/task creation until confirmed
        const { error: taskError } = await supabaseAdmin.insert('tasks', {
            client_id: clientId,
            type: 'confirm_client',
            title: `Confirmer nouveau client: ${quoteData.clientCompany}`,
            description: `Devis ${number} signé. Vérifier les informations et confirmer pour créer le projet et les tâches automatiques.`,
            status: 'pending',
            priority: 'high',
            auto_generated: true,
            metadata: JSON.stringify({
                quote_number: number,
                plan_id: quoteData.planName?.toLowerCase().includes('essentiel') ? 'essentiel'
                    : quoteData.planName?.toLowerCase().includes('premium') ? 'premium'
                        : 'business',
                total_ttc: quoteData.totalTtc,
                monthly_total: quoteData.monthlyTotal,
                has_recurring: quoteData.monthlyTotal > 0,
            }),
        });

        if (taskError) {
            console.error('Task creation error:', taskError);
        }

        // 4. Return success - but tasks will NOT be created yet
        return NextResponse.json({
            success: true,
            clientId,
            quoteId: (quote as Array<{ id?: string }>)?.[0]?.id || null,
            status: 'pending_confirmation',
            message: 'Devis signé. En attente de confirmation admin pour créer le projet.',
        });

    } catch (error) {
        console.error('Signature processing error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
