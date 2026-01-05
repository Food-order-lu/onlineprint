// One-Time Charges API Route
// POST /api/one-time-charges - Add a one-time charge to a client

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import type { OneTimeCharge } from '@/lib/db/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const requiredFields = ['client_id', 'description', 'amount'];
        for (const field of requiredFields) {
            if (!body[field] && body[field] !== 0) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Create one-time charge
        const chargeInput = {
            client_id: body.client_id,
            description: body.description,
            amount: parseFloat(body.amount),
            invoiced: false,
            invoice_id: null,
        };

        const { data, error } = await supabaseAdmin.insert<OneTimeCharge>('one_time_charges', chargeInput);

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) throw new Error('Failed to create one-time charge');

        return NextResponse.json({ charge: data[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating one-time charge:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create one-time charge' },
            { status: 500 }
        );
    }
}

// GET /api/one-time-charges?client_id=xxx - Get one-time charges for a client
export async function GET(request: NextRequest) {
    try {
        const clientId = request.nextUrl.searchParams.get('client_id');

        if (!clientId) {
            return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin.select<OneTimeCharge>(
            'one_time_charges',
            `client_id=eq.${clientId}&order=created_at.desc`
        );

        if (error) throw new Error(error.message);

        return NextResponse.json({ charges: data || [] });
    } catch (error) {
        console.error('Error fetching one-time charges:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch one-time charges' },
            { status: 500 }
        );
    }
}
