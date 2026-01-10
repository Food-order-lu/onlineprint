// Create GoCardless Mandate API Route
// Path: /api/gocardless/create-mandate

import { NextRequest, NextResponse } from 'next/server';
import { gocardless } from '@/lib/gocardless/client';
import { supabaseAdmin, getClientById } from '@/lib/db/supabase';

// POST /api/gocardless/create-mandate
// Creates a billing request and returns the authorization URL
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { client_id, redirect_uri, exit_uri } = body;

        if (!client_id) {
            return NextResponse.json(
                { error: 'client_id is required' },
                { status: 400 }
            );
        }

        // Get client
        const client = await getClientById(client_id);
        if (!client) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        // Check if client already has an active mandate
        const { data: existingMandates } = await supabaseAdmin.select<{
            id: string;
            status: string;
        }>('gocardless_mandates', `client_id=eq.${client_id}&status=eq.active`);

        if (existingMandates && existingMandates.length > 0) {
            return NextResponse.json(
                { error: 'Client already has an active mandate' },
                { status: 400 }
            );
        }

        // Create billing request
        const billingRequestResult = await gocardless.createBillingRequest({
            customer_email: client.email,
            customer_name: client.contact_name,
            company_name: client.company_name,
            description: `Mandat SEPA pour ${client.company_name}`,
            metadata: {
                client_id: client.id,
                company_name: client.company_name,
            },
        });

        // GoCardless returns { billing_requests: {...} } (plural key)
        const billing_request = billingRequestResult.billing_requests;

        if (!billing_request || !billing_request.id) {
            console.error('GoCardless response:', JSON.stringify(billingRequestResult));
            throw new Error('Failed to create billing request - no ID returned');
        }

        // Set up default URIs
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const defaultRedirectUri = `${baseUrl}/client/mandate-success`;
        const defaultExitUri = `${baseUrl}/client/mandate-cancelled`;

        // Create billing request flow (hosted page)
        const { billing_request_flows } = await gocardless.createBillingRequestFlow({
            billing_request_id: billing_request.id,
            redirect_uri: redirect_uri || defaultRedirectUri,
            exit_uri: exit_uri || defaultExitUri,
        });

        // Store pending mandate in database
        const { error: insertError } = await supabaseAdmin.insert('gocardless_mandates', {
            client_id: client.id,
            billing_request_id: billing_request.id,
            status: 'pending',
        });

        if (insertError) {
            console.error('Failed to store mandate:', insertError);
        }

        let emailResult = null;
        if (body.send_email && billing_request_flows.authorisation_url) {
            const { sendEmail } = await import('@/lib/resend');
            emailResult = await sendEmail({
                to: client.email,
                subject: 'Mise en place du prélèvement SEPA - Rivego',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Bonjour ${client.contact_name},</h2>
                        <p>Afin de finaliser la mise en place de vos services, merci de bien vouloir configurer le mandat de prélèvement SEPA en cliquant sur le bouton ci-dessous :</p>
                        <br/>
                        <a href="${billing_request_flows.authorisation_url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Configurer le prélèvement SEPA
                        </a>
                        <br/><br/>
                        <p>Ce lien est sécurisé et géré par notre partenaire GoCardless.</p>
                        <p>Cordialement,<br/>L'équipe Rivego</p>
                    </div>
                `,
                text: `Bonjour ${client.contact_name},\n\nMerci de configurer votre mandat SEPA via ce lien : ${billing_request_flows.authorisation_url}`
            });
        }

        return NextResponse.json({
            success: true,
            authorization_url: billing_request_flows.authorisation_url,
            billing_request_id: billing_request.id,
            email_sent: emailResult?.success || false
        });
    } catch (error) {
        console.error('Error creating mandate:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create mandate' },
            { status: 500 }
        );
    }
}
