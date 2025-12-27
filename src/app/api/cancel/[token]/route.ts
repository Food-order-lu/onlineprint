// Cancellation Token API Routes
// Path: /api/cancel/[token]

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getClientById, updateClient } from '@/lib/db/supabase';

interface RouteParams {
    params: Promise<{ token: string }>;
}

// GET /api/cancel/[token] - Get cancellation data
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { token } = await params;

        // Find cancellation request by token
        const { data: requests, error } = await supabaseAdmin.select<{
            id: string;
            client_id: string;
            cancel_type: 'full' | 'service';
            subscription_id: string | null;
            reason: string | null;
            requested_at: string;
            signed_at: string | null;
            effective_at: string | null;
        }>('cancellation_requests', `token=eq.${token}`);

        if (error) throw new Error(error.message);
        if (!requests || requests.length === 0) {
            return NextResponse.json(
                { error: 'Cancellation request not found' },
                { status: 404 }
            );
        }

        const cancellationRequest = requests[0];

        // Get client data
        const client = await getClientById(cancellationRequest.client_id);
        if (!client) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        // Calculate effective date (2 months from now or from signature date)
        let effectiveDate: Date;
        if (cancellationRequest.signed_at) {
            effectiveDate = new Date(cancellationRequest.effective_at!);
        } else {
            effectiveDate = new Date();
            effectiveDate.setMonth(effectiveDate.getMonth() + 2);
        }

        // Get subscription if partial cancellation
        let subscription = null;
        if (cancellationRequest.subscription_id) {
            const { data: subs } = await supabaseAdmin.select<{
                id: string;
                service_name: string | null;
                service_type: string;
                monthly_amount: number;
            }>('subscriptions', `id=eq.${cancellationRequest.subscription_id}`);
            if (subs && subs.length > 0) {
                subscription = subs[0];
            }
        }

        return NextResponse.json({
            cancellation: {
                id: cancellationRequest.id,
                client: {
                    company_name: client.company_name,
                    contact_name: client.contact_name,
                    email: client.email,
                },
                cancel_type: cancellationRequest.cancel_type,
                subscription,
                requested_at: cancellationRequest.requested_at,
                effective_at: effectiveDate.toISOString(),
                already_signed: !!cancellationRequest.signed_at,
            }
        });
    } catch (error) {
        console.error('Error fetching cancellation:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cancellation data' },
            { status: 500 }
        );
    }
}
