// Cancellation Signature API Route
// Path: /api/cancel/[token]/sign

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, updateClient, getClientById, cancelSubscription } from '@/lib/db/supabase';

interface RouteParams {
    params: Promise<{ token: string }>;
}

// POST /api/cancel/[token]/sign - Sign cancellation
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { token } = await params;
        const body = await request.json();

        if (!body.signature) {
            return NextResponse.json(
                { error: 'Signature is required' },
                { status: 400 }
            );
        }

        // Find cancellation request
        const { data: requests, error } = await supabaseAdmin.select<{
            id: string;
            client_id: string;
            cancel_type: 'full' | 'service';
            subscription_id: string | null;
            signed_at: string | null;
        }>('cancellation_requests', `token=eq.${token}`);

        if (error) throw new Error(error.message);
        if (!requests || requests.length === 0) {
            return NextResponse.json(
                { error: 'Cancellation request not found' },
                { status: 404 }
            );
        }

        const cancellationRequest = requests[0];

        // Check if already signed
        if (cancellationRequest.signed_at) {
            return NextResponse.json(
                { error: 'This cancellation has already been signed' },
                { status: 400 }
            );
        }

        // Get client IP
        const forwardedFor = request.headers.get('x-forwarded-for');
        const signerIp = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

        // Calculate effective date: 2 months from now
        const effectiveDate = new Date();
        effectiveDate.setMonth(effectiveDate.getMonth() + 2);
        // Set to last day of that month for billing purposes
        effectiveDate.setDate(0); // This sets to last day of previous month
        effectiveDate.setMonth(effectiveDate.getMonth() + 1);
        effectiveDate.setDate(0);

        const now = new Date().toISOString();

        // Update cancellation request
        const { error: updateError } = await supabaseAdmin.update(
            'cancellation_requests',
            `id=eq.${cancellationRequest.id}`,
            {
                signed_at: now,
                signature_data: body.signature,
                signer_ip: signerIp,
                effective_at: effectiveDate.toISOString().split('T')[0],
                processed: false, // Will be processed by cron job when effective date is reached
            }
        );

        if (updateError) throw new Error(updateError.message);

        // Update client
        await updateClient(cancellationRequest.client_id, {
            cancellation_signed_at: now,
            cancellation_effective_at: effectiveDate.toISOString(),
        });

        // If partial cancellation (single service), cancel the subscription now but keep billing for 2 months
        if (cancellationRequest.cancel_type === 'service' && cancellationRequest.subscription_id) {
            // Mark subscription as pending cancellation - billing continues until effective date
            await supabaseAdmin.update(
                'subscriptions',
                `id=eq.${cancellationRequest.subscription_id}`,
                {
                    status: 'paused', // Will be cancelled by cron job
                    cancelled_at: effectiveDate.toISOString().split('T')[0],
                }
            );
        }

        // Get client for email
        const client = await getClientById(cancellationRequest.client_id);

        // TODO: Send confirmation email to client
        console.log(`Cancellation signed for ${client?.email}. Effective date: ${effectiveDate.toLocaleDateString()}`);

        // TODO: Notify admin of signed cancellation

        return NextResponse.json({
            success: true,
            effective_at: effectiveDate.toISOString(),
            message: 'Cancellation signed successfully. Effective in 2 months.',
        });
    } catch (error) {
        console.error('Error signing cancellation:', error);
        return NextResponse.json(
            { error: 'Failed to process signature' },
            { status: 500 }
        );
    }
}
