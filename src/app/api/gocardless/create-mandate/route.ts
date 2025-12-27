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
        const { billing_request } = await gocardless.createBillingRequest({
            customer_email: client.email,
            customer_name: client.contact_name,
            company_name: client.company_name,
            description: `Mandat SEPA pour ${client.company_name}`,
            metadata: {
                client_id: client.id,
                company_name: client.company_name,
            },
        });

        // Set up default URIs
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const defaultRedirectUri = `${baseUrl}/client/mandate-success`;
        const defaultExitUri = `${baseUrl}/client/mandate-cancelled`;

        // Create billing request flow (hosted page)
        const { billing_request_flows } = await gocardless.createBillingRequestFlow({
            billing_request_id: billing_request.id,
            redirect_uri: redirect_uri || defaultRedirectUri,
            exit_uri: exit_uri || defaultExitUri,
            customer_details: {
                email: client.email,
                given_name: client.contact_name.split(' ')[0],
                family_name: client.contact_name.split(' ').slice(1).join(' ') || client.contact_name,
                company_name: client.company_name,
            },
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

        return NextResponse.json({
            success: true,
            authorization_url: billing_request_flows.authorisation_url,
            billing_request_id: billing_request.id,
        });
    } catch (error) {
        console.error('Error creating mandate:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create mandate' },
            { status: 500 }
        );
    }
}
