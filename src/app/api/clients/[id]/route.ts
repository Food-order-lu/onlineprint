// Client Detail API Route
// Path: /api/clients/[id]

import { NextRequest, NextResponse } from 'next/server';
import {
    getClientById,
    getClientWithSubscriptions,
    updateClient,
    deleteClient,
    getInvoicesByClient
} from '@/lib/db/supabase';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/clients/[id] - Get client details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const clientWithSubs = await getClientWithSubscriptions(id);

        if (!clientWithSubs) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        // Get invoices
        const invoices = await getInvoicesByClient(id);

        return NextResponse.json({
            client: {
                ...clientWithSubs,
                invoices,
            }
        });
    } catch (error) {
        console.error('Error fetching client:', error);
        return NextResponse.json(
            { error: 'Failed to fetch client' },
            { status: 500 }
        );
    }
}

// PATCH /api/clients/[id] - Update client
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Check client exists
        const existing = await getClientById(id);
        if (!existing) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        // Validate email if provided
        if (body.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(body.email)) {
                return NextResponse.json(
                    { error: 'Invalid email format' },
                    { status: 400 }
                );
            }
        }

        const client = await updateClient(id, body);

        return NextResponse.json({ client });
    } catch (error) {
        console.error('Error updating client:', error);
        return NextResponse.json(
            { error: 'Failed to update client' },
            { status: 500 }
        );
    }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Check client exists
        const existing = await getClientById(id);
        if (!existing) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        await deleteClient(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json(
            { error: 'Failed to delete client' },
            { status: 500 }
        );
    }
}
