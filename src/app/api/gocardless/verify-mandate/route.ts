
import { NextRequest, NextResponse } from 'next/server';
import { gocardless } from '@/lib/gocardless/client';
import { supabaseAdmin, updateMandateStatus } from '@/lib/db/supabase';

// GET /api/gocardless/verify-mandate?client_id=...
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('client_id');

        if (!clientId) {
            return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
        }

        // Get pending mandate for this client
        const { data: mandates } = await supabaseAdmin.select<{
            id: string;
            billing_request_id: string;
            status: string;
            mandate_id?: string;
        }>('gocardless_mandates', `client_id=eq.${clientId}&order=created_at.desc&limit=1`);

        if (!mandates || mandates.length === 0) {
            return NextResponse.json({ error: 'No mandate found for this client' }, { status: 404 });
        }

        const mandate = mandates[0];
        console.log('Verifying mandate:', mandate);

        // Fetch status from GoCardless
        const { billing_requests } = await gocardless.getBillingRequest(mandate.billing_request_id);
        console.log('GC Billing Request Status:', billing_requests.status);

        let newStatus = mandate.status;
        let mandateId = mandate.mandate_id;

        // Check billing request status
        if (billing_requests.status === 'fulfilled') {
            newStatus = 'active';
            // Extract mandate ID from links if available (using any cast or bracket notation to bypass strict type)
            const links = billing_requests.links as any;
            if (links?.mandate_request_mandate) {
                mandateId = links.mandate_request_mandate;
            }
        } else if (billing_requests.status === 'cancelled') {
            newStatus = 'cancelled';
        }

        // Update DB if status changed
        if (newStatus !== mandate.status || mandateId !== mandate.mandate_id) {
            await supabaseAdmin.update(
                'gocardless_mandates',
                `id=eq.${mandate.id}`,
                {
                    status: newStatus,
                    mandate_id: mandateId,
                    activated_at: newStatus === 'active' ? new Date().toISOString() : undefined
                }
            );
        }

        return NextResponse.json({
            success: true,
            status: newStatus,
            billing_request_status: billing_requests.status
        });

    } catch (error) {
        console.error('Verification Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Verification failed' },
            { status: 500 }
        );
    }
}
