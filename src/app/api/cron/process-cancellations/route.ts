// CRON Job: Process Cancelled Clients
// Path: /api/cron/process-cancellations
// Run daily to check for cancellations that have reached their effective date

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, updateClient } from '@/lib/db/supabase';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET || '';

export async function GET(request: NextRequest) {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        const results = {
            clients_deactivated: 0,
            subscriptions_cancelled: 0,
            errors: [] as string[],
        };

        // ==========================================================================
        // 1. Find clients with cancellation effective date <= today
        // ==========================================================================

        const { data: clientsToDeactivate, error: clientsError } = await supabaseAdmin.select<{
            id: string;
            email: string;
            company_name: string;
            cancellation_effective_at: string;
        }>('clients', `status=eq.pending_cancellation&cancellation_effective_at=lte.${today}`);

        if (clientsError) {
            results.errors.push(`Failed to fetch clients: ${clientsError.message}`);
        } else if (clientsToDeactivate && clientsToDeactivate.length > 0) {
            for (const client of clientsToDeactivate) {
                try {
                    // Deactivate client
                    await updateClient(client.id, {
                        status: 'inactive',
                    });

                    // Cancel all active subscriptions
                    const { error: subsError } = await supabaseAdmin.update(
                        'subscriptions',
                        `client_id=eq.${client.id}&status=eq.active`,
                        {
                            status: 'cancelled',
                            cancelled_at: today,
                        }
                    );

                    if (subsError) {
                        results.errors.push(`Failed to cancel subscriptions for ${client.email}: ${subsError.message}`);
                    }

                    // Cancel GoCardless mandate if exists
                    const { data: mandates } = await supabaseAdmin.select<{
                        mandate_id: string;
                    }>('gocardless_mandates', `client_id=eq.${client.id}&status=eq.active`);

                    if (mandates && mandates.length > 0) {
                        // Mark as cancelled in our DB (GoCardless will be notified separately)
                        await supabaseAdmin.update(
                            'gocardless_mandates',
                            `client_id=eq.${client.id}&status=eq.active`,
                            {
                                status: 'cancelled',
                                cancelled_at: new Date().toISOString(),
                            }
                        );

                        // TODO: Actually cancel in GoCardless API
                        // await gocardless.cancelMandate(mandates[0].mandate_id);
                    }

                    // Mark cancellation request as processed
                    await supabaseAdmin.update(
                        'cancellation_requests',
                        `client_id=eq.${client.id}&processed=eq.false`,
                        {
                            processed: true,
                            processed_at: new Date().toISOString(),
                        }
                    );

                    results.clients_deactivated++;
                    console.log(`Deactivated client: ${client.company_name} (${client.email})`);

                    // TODO: Send confirmation email to client

                } catch (err) {
                    results.errors.push(`Failed to process client ${client.email}: ${err}`);
                }
            }
        }

        // ==========================================================================
        // 2. Find individual subscriptions to cancel (partial cancellations)
        // ==========================================================================

        const { data: subsToCancel, error: subsError } = await supabaseAdmin.select<{
            id: string;
            client_id: string;
            service_name: string;
            cancelled_at: string;
        }>('subscriptions', `status=eq.paused&cancelled_at=lte.${today}`);

        if (subsError) {
            results.errors.push(`Failed to fetch subscriptions: ${subsError.message}`);
        } else if (subsToCancel && subsToCancel.length > 0) {
            for (const sub of subsToCancel) {
                try {
                    await supabaseAdmin.update(
                        'subscriptions',
                        `id=eq.${sub.id}`,
                        { status: 'cancelled' }
                    );

                    results.subscriptions_cancelled++;
                    console.log(`Cancelled subscription: ${sub.service_name} for client ${sub.client_id}`);

                } catch (err) {
                    results.errors.push(`Failed to cancel subscription ${sub.id}: ${err}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            processed_at: new Date().toISOString(),
            results,
        });

    } catch (error) {
        console.error('CRON process-cancellations error:', error);
        return NextResponse.json(
            { error: 'Failed to process cancellations' },
            { status: 500 }
        );
    }
}
