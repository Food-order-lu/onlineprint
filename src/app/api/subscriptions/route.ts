// Subscriptions API Route
// POST /api/subscriptions - Create a new subscription for a client

import { NextRequest, NextResponse } from 'next/server';
import { createSubscription, supabaseAdmin } from '@/lib/db/supabase';
import type { ServiceType, SubscriptionStatus, OneTimeCharge } from '@/lib/db/types';
import { getCurrentDate } from '@/lib/date-helper';

// Calculate prorated amount for partial month
function calculateProration(monthlyAmount: number, startDateStr: string, today: Date): { amount: number; days: number; totalDays: number } | null {
    // const today = new Date(); // Pass 'today' as argument to mock time
    const startDate = new Date(startDateStr);

    // Only prorate if start date is in current month
    if (startDate.getMonth() !== today.getMonth() || startDate.getFullYear() !== today.getFullYear()) {
        return null;
    }

    // Only prorate if start date is not the 1st
    if (startDate.getDate() === 1) {
        return null;
    }

    const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const daysInMonth = endOfMonth.getDate();
    const daysActive = daysInMonth - startDate.getDate() + 1; // Inclusive

    const proratedAmount = (monthlyAmount / daysInMonth) * daysActive;

    return {
        amount: Math.round(proratedAmount * 100) / 100,
        days: daysActive,
        totalDays: daysInMonth
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const requiredFields = ['client_id', 'service_type', 'monthly_amount'];
        for (const field of requiredFields) {
            if (!body[field] && body[field] !== 0) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        const today = await getCurrentDate();
        const startedAt = body.started_at || today.toISOString().split('T')[0];
        const monthlyAmount = parseFloat(body.monthly_amount);

        // Create subscription
        const subscriptionInput = {
            client_id: body.client_id,
            service_type: body.service_type as ServiceType,
            service_name: body.service_name || null,
            description: body.description || null,
            monthly_amount: monthlyAmount,
            commission_percent: parseFloat(body.commission_percent || 0),
            status: 'active' as SubscriptionStatus,
            started_at: startedAt,
            cancelled_at: null,
        };

        const subscription = await createSubscription(subscriptionInput);

        // Calculate and create proration charge if applicable
        let prorationChargeId = null;
        try {
            const proration = calculateProration(monthlyAmount, startedAt, today);

            if (proration && proration.amount > 0) {
                const { data: chargeData } = await supabaseAdmin.insert<OneTimeCharge>('one_time_charges', {
                    client_id: body.client_id,
                    description: `Prorata ${body.service_name || body.service_type} (${proration.days}/${proration.totalDays} jours)`,
                    amount: proration.amount,
                    invoiced: false,
                    invoice_id: null,
                });

                if (chargeData && chargeData[0]) {
                    prorationChargeId = chargeData[0].id;
                    console.log(`Created proration charge for new subscription: ${proration.amount}€`);
                }
            }
        } catch (prorationError) {
            console.error('Failed to create proration charge:', prorationError);
            // Non-blocking
        }

        return NextResponse.json({
            subscription,
            prorationChargeId
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating subscription:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create subscription' },
            { status: 500 }
        );
    }
}
