// Subscription Detail API Route
// DELETE /api/subscriptions/[id] - Cancel a subscription with proration

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, cancelSubscription, getSubscriptionById } from '@/lib/db/supabase';
import type { OneTimeCharge, Subscription } from '@/lib/db/types';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// Calculate prorated amount for mid-month cancellation
function calculateProration(subscription: Subscription): { proratedAmount: number; daysUsed: number; daysInMonth: number } {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const daysInMonth = endOfMonth.getDate();
    const dayOfMonth = today.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;
    const daysUsed = dayOfMonth;

    // Calculate credit for unused portion (will be deducted from next invoice)
    // Or calculate charge for days used if cancelling before end of month
    const proratedAmount = (subscription.monthly_amount / daysInMonth) * daysUsed;

    return {
        proratedAmount: Math.round(proratedAmount * 100) / 100, // Round to 2 decimals
        daysUsed,
        daysInMonth,
    };
}

// DELETE - Cancel subscription with proration
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Get subscription details first
        const subscription = await getSubscriptionById(id);

        if (!subscription) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        // Calculate proration for mid-month cancellation
        const today = new Date();
        const dayOfMonth = today.getDate();
        let proratedChargeId = null;

        // If cancelling mid-month (not on the 1st), create prorated adjustment
        if (dayOfMonth > 1 && subscription.status === 'active') {
            const proration = calculateProration(subscription);

            // Create a prorated adjustment one-time charge
            // This represents the amount for days used in current month
            const { data: chargeData } = await supabaseAdmin.insert<OneTimeCharge>('one_time_charges', {
                client_id: subscription.client_id,
                description: `Prorata ${subscription.service_name || subscription.service_type} - ${proration.daysUsed}/${proration.daysInMonth} jours`,
                amount: proration.proratedAmount,
                invoiced: false,
                invoice_id: null,
            });

            proratedChargeId = chargeData?.[0]?.id;
            console.log(`Created prorated charge of €${proration.proratedAmount} for subscription ${id}`);
        }

        // Cancel the subscription
        const cancelledSubscription = await cancelSubscription(id);

        return NextResponse.json({
            subscription: cancelledSubscription,
            message: 'Subscription cancelled',
            proratedChargeId,
            proration: dayOfMonth > 1 ? {
                daysUsed: dayOfMonth,
                chargeCreated: true,
            } : null,
        });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
            { status: 500 }
        );
    }
}
