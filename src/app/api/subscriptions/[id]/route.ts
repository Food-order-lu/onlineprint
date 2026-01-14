
// Subscription Detail API Route
// DELETE /api/subscriptions/[id] - Cancel a subscription with proration
// PATCH /api/subscriptions/[id] - Update subscription details (specifically started_at, recalculating prorata)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, cancelSubscription, getSubscriptionById } from '@/lib/db/supabase';
import type { OneTimeCharge, Subscription } from '@/lib/db/types';
import { getCurrentDate } from '@/lib/date-helper';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// Calculate prorated amount helpers
function calculateProrationDetails(monthlyAmount: number, startDateStr: string, today: Date): { amount: number; days: number; totalDays: number } | null {
    const startDate = new Date(startDateStr);

    // Only prorate if start date is in current month
    if (startDate.getMonth() !== today.getMonth() || startDate.getFullYear() !== today.getFullYear()) {
        return null; // No proration needed (future or past month)
    }

    // Only prorate if start date is not the 1st
    if (startDate.getDate() === 1) {
        return null;
    }

    const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const daysInMonth = endOfMonth.getDate();
    const daysActive = daysInMonth - startDate.getDate() + 1; // Inclusive (e.g. 14th to 31st = 18 days)

    const proratedAmount = (monthlyAmount / daysInMonth) * daysActive;

    return {
        amount: Math.round(proratedAmount * 100) / 100,
        days: daysActive,
        totalDays: daysInMonth
    };
}

// DELETE - Cancel subscription with proration
// (Preserved existing logic but cleaned up imports/helpers)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const subscription = await getSubscriptionById(id);

        if (!subscription) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        const today = await getCurrentDate();
        const dayOfMonth = today.getDate();
        let proratedChargeId = null;

        // If cancelling mid-month (not on the 1st), create prorated adjustment
        if (dayOfMonth > 1 && subscription.status === 'active') {
            // Logic for cancellation proration (credits/charges) - kept simple for now
            // reusing existing loose logic from previous implementation
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            const daysInMonth = endOfMonth.getDate();
            const daysUsed = dayOfMonth;
            const proratedAmount = (subscription.monthly_amount / daysInMonth) * daysUsed;
            const amount = Math.round(proratedAmount * 100) / 100;

            const { data: chargeData } = await supabaseAdmin.insert<OneTimeCharge>('one_time_charges', {
                client_id: subscription.client_id,
                description: `Prorata ${subscription.service_name || subscription.service_type} - ${daysUsed}/${daysInMonth} jours`,
                amount: amount,
                invoiced: false,
                invoice_id: null,
            });

            proratedChargeId = chargeData?.[0]?.id;
        }

        const cancelledSubscription = await cancelSubscription(id);

        return NextResponse.json({
            subscription: cancelledSubscription,
            message: 'Subscription cancelled',
            proratedChargeId
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH - Update subscription details (specifically started_at)
// Handles recalculating pending "Prorata" charge
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        // 1. Fetch Subscription to get context
        const subscription = await getSubscriptionById(id);
        if (!subscription) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

        if (body.started_at) {
            // 2. Update Subscription Date
            const { error } = await supabaseAdmin.update('subscriptions', `id=eq.${id}`, {
                started_at: body.started_at
            });
            if (error) throw error;

            console.log(`Updated subscription ${id} start date to ${body.started_at}`);

            // 3. Recalculate Prorata Logic
            const today = await getCurrentDate();
            const proration = calculateProrationDetails(subscription.monthly_amount, body.started_at, today);

            // 4. Find existing Pending Prorata Charge for this client/service
            // Heuristic: Search for pending charge matching partial description "Prorata [Service]"
            // This is safer than ID tracking if we didn't store the relationship.
            const serviceLabel = subscription.service_name || subscription.service_type;
            const { data: existingCharges } = await supabaseAdmin.select<OneTimeCharge>(
                'one_time_charges',
                `client_id=eq.${subscription.client_id}&invoiced=eq.false&description=ilike.Prorata%${serviceLabel}%`
            );

            const existingCharge = existingCharges && existingCharges.length > 0 ? existingCharges[0] : null;

            if (proration && proration.amount > 0) {
                // Should have a charge.
                const newDesc = `Prorata ${serviceLabel} (${proration.days}/${proration.totalDays} jours)`;

                if (existingCharge) {
                    // Update existing
                    await supabaseAdmin.update('one_time_charges', `id=eq.${existingCharge.id}`, {
                        amount: proration.amount,
                        description: newDesc
                    });
                    console.log(`Updated Prorata Charge ${existingCharge.id} to ${proration.amount}€`);
                } else {
                    // Create new
                    await supabaseAdmin.insert('one_time_charges', {
                        client_id: subscription.client_id,
                        description: newDesc,
                        amount: proration.amount,
                        invoiced: false,
                        invoice_id: null
                    });
                    console.log(`Created new Prorata Charge for updated date: ${proration.amount}€`);
                }
            } else {
                // Should NOT have a charge (start date moved to future or 1st of month).
                if (existingCharge) {
                    // Delete existing invalid charge
                    await supabaseAdmin.delete('one_time_charges', `id=eq.${existingCharge.id}`);
                    console.log(`Deleted obsolete Prorata Charge ${existingCharge.id}`);
                }
            }

            return NextResponse.json({ success: true, message: 'Date and Prorata updated' });
        }

        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });

    } catch (error: any) {
        console.error('Error updating subscription:', error);
        return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
        );
    }
}
