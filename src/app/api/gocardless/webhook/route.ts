// GoCardless Webhook Handler
// Path: /api/gocardless/webhook

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, GoCardlessWebhookEvent } from '@/lib/gocardless/client';
import { supabaseAdmin, updateMandateStatus } from '@/lib/db/supabase';

const GOCARDLESS_WEBHOOK_SECRET = process.env.GOCARDLESS_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('Webhook-Signature') || '';

        // Verify webhook signature
        if (GOCARDLESS_WEBHOOK_SECRET && !verifyWebhookSignature(body, signature, GOCARDLESS_WEBHOOK_SECRET)) {
            console.error('Invalid webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const payload = JSON.parse(body);
        const events: GoCardlessWebhookEvent[] = payload.events || [];

        for (const event of events) {
            console.log(`Processing GoCardless event: ${event.resource_type}:${event.action}`);

            switch (event.resource_type) {
                case 'mandates':
                    await handleMandateEvent(event);
                    break;
                case 'payments':
                    await handlePaymentEvent(event);
                    break;
                case 'billing_requests':
                    await handleBillingRequestEvent(event);
                    break;
                default:
                    console.log(`Unhandled event type: ${event.resource_type}`);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

async function handleMandateEvent(event: GoCardlessWebhookEvent) {
    const mandateId = event.links.mandate;

    switch (event.action) {
        case 'created':
        case 'submitted':
            // Mandate is being set up
            await updateMandateStatus(mandateId, 'pending');
            break;

        case 'active':
            // Mandate is now active and can be charged
            await updateMandateStatus(mandateId, 'active');
            console.log(`Mandate ${mandateId} is now active`);
            break;

        case 'cancelled':
        case 'expired':
            // Mandate is no longer valid
            await updateMandateStatus(mandateId, 'cancelled');
            console.log(`Mandate ${mandateId} cancelled/expired`);
            break;

        case 'failed':
            // Mandate setup failed
            await updateMandateStatus(mandateId, 'failed');
            console.error(`Mandate ${mandateId} failed: ${event.details?.description}`);
            // TODO: Notify admin
            break;
    }
}

async function handlePaymentEvent(event: GoCardlessWebhookEvent) {
    const paymentId = event.links.payment;

    switch (event.action) {
        case 'created':
        case 'submitted':
            // Payment is pending
            console.log(`Payment ${paymentId} submitted`);
            break;

        case 'confirmed':
            // Payment confirmed (will succeed)
            console.log(`Payment ${paymentId} confirmed`);
            break;

        case 'paid_out':
            // Money has been paid to our bank account
            console.log(`Payment ${paymentId} paid out`);

            // Update invoice status
            const { data: invoices } = await supabaseAdmin.select<{
                id: string;
                invoice_number: string;
            }>('invoices', `gocardless_payment_id=eq.${paymentId}`);

            if (invoices && invoices.length > 0) {
                await supabaseAdmin.update(
                    'invoices',
                    `id=eq.${invoices[0].id}`,
                    {
                        status: 'paid',
                        paid_at: new Date().toISOString().split('T')[0],
                    }
                );
                console.log(`Invoice ${invoices[0].invoice_number} marked as paid`);
            }
            break;

        case 'failed':
            // Payment failed
            console.error(`Payment ${paymentId} failed: ${event.details?.description}`);

            // Update invoice status to overdue
            const { data: failedInvoices } = await supabaseAdmin.select<{
                id: string;
                client_id: string;
            }>('invoices', `gocardless_payment_id=eq.${paymentId}`);

            if (failedInvoices && failedInvoices.length > 0) {
                await supabaseAdmin.update(
                    'invoices',
                    `id=eq.${failedInvoices[0].id}`,
                    { status: 'overdue' }
                );
                // TODO: Notify admin of failed payment
                // TODO: Send email to client
            }
            break;

        case 'cancelled':
            console.log(`Payment ${paymentId} cancelled`);
            break;

        case 'charged_back':
            // Customer disputed the payment
            console.error(`Payment ${paymentId} charged back!`);
            // TODO: Notify admin immediately
            break;
    }
}

async function handleBillingRequestEvent(event: GoCardlessWebhookEvent) {
    const billingRequestId = event.links.billing_request;

    switch (event.action) {
        case 'fulfilled':
            // Billing request completed - mandate is set up
            console.log(`Billing request ${billingRequestId} fulfilled`);

            // The mandate ID should be in the event links
            if (event.links.mandate) {
                // Update our database with the new mandate
                const { data: mandates } = await supabaseAdmin.select<{
                    id: string;
                    client_id: string;
                }>('gocardless_mandates', `billing_request_id=eq.${billingRequestId}`);

                if (mandates && mandates.length > 0) {
                    await supabaseAdmin.update(
                        'gocardless_mandates',
                        `id=eq.${mandates[0].id}`,
                        {
                            mandate_id: event.links.mandate,
                            status: 'active',
                            activated_at: new Date().toISOString(),
                        }
                    );
                }
            }
            break;

        case 'cancelled':
            console.log(`Billing request ${billingRequestId} cancelled`);

            // Update mandate status
            const { data: cancelledMandates } = await supabaseAdmin.select<{
                id: string;
            }>('gocardless_mandates', `billing_request_id=eq.${billingRequestId}`);

            if (cancelledMandates && cancelledMandates.length > 0) {
                await supabaseAdmin.update(
                    'gocardless_mandates',
                    `id=eq.${cancelledMandates[0].id}`,
                    { status: 'cancelled' }
                );
            }
            break;
    }
}
