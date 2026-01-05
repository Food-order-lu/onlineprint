// Clients API Route
// Path: /api/clients

import { NextRequest, NextResponse } from 'next/server';
import {
    getClients,
    createClient,
    updateClient,
    getClientWithSubscriptions,
} from '@/lib/db/supabase';
import type { CreateClientInput, ClientStatus, ClientType } from '@/lib/db/types';

// GET /api/clients - List all clients
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status') as ClientStatus | null;
        const type = searchParams.get('type') as ClientType | null;

        const clients = await getClients(status || undefined, type || undefined);

        // Enrich with subscription totals
        const enrichedClients = await Promise.all(
            clients.map(async (client) => {
                const full = await getClientWithSubscriptions(client.id);
                return {
                    ...client,
                    total_monthly: full?.total_monthly || 0,
                    has_mandate: !!full?.mandate,
                };
            })
        );

        return NextResponse.json({ clients: enrichedClients });
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json(
            { error: 'Failed to fetch clients' },
            { status: 500 }
        );
    }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const requiredFields = ['company_name', 'contact_name', 'email'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        const clientInput: CreateClientInput = {
            company_name: body.company_name,
            contact_name: body.contact_name,
            email: body.email,
            phone: body.phone || null,
            address: body.address || null,
            city: body.city || null,
            postal_code: body.postal_code || null,
            country: body.country || 'Luxembourg',
            vat_number: body.vat_number || null,
            status: body.status || 'active',
            client_type: body.client_type || 'new',
            cancellation_requested_at: null,
            cancellation_effective_at: null,
            cancellation_reason: null,
            cancellation_signed_at: null,
            sepa_exception: body.sepa_exception || false,
            sepa_exception_reason: body.sepa_exception_reason || null,
            notes: body.notes || null,
            commission_config: body.commission_config || null,
            payment_method: body.payment_method || 'sepa',
            zoho_contact_id: null,
            referral_code: body.referral_code || null,
            referred_by: body.referred_by || null,
        };

        const client = await createClient(clientInput);

        // Sync to Zoho Books
        try {
            // Import dynamically to avoid circular dependencies if any, or just import at top
            const { zoho } = await import('@/lib/invoicing/zoho');

            console.log(`Syncing client ${client.email} to Zoho...`);
            const zohoContact = await zoho.getOrCreateContact({
                email: client.email,
                company_name: client.company_name,
                contact_name: client.contact_name,
                phone: client.phone || undefined,
                address: client.address || undefined,
                city: client.city || undefined,
                postal_code: client.postal_code || undefined,
                country: client.country || 'Luxembourg',
                vat_number: client.vat_number || undefined,
            });
            console.log(`Synced to Zoho Contact ID: ${zohoContact.contact_id}`);

            // Update client with zoho_contact_id
            await updateClient(client.id, { zoho_contact_id: zohoContact.contact_id });

        } catch (zohoError) {
            console.error('Failed to sync client to Zoho:', zohoError);
            // We don't block the response, just log the error
        }

        return NextResponse.json({ client }, { status: 201 });
    } catch (error) {
        console.error('Error creating client:', error);

        // Check for duplicate email
        if (error instanceof Error && error.message.includes('duplicate')) {
            return NextResponse.json(
                { error: 'A client with this email already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create client' },
            { status: 500 }
        );
    }
}
