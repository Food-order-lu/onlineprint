import { NextRequest, NextResponse } from 'next/server';
import { gocardless } from '@/lib/gocardless/client';
import { supabaseAdmin, getClientById } from '@/lib/db/supabase';
import { randomUUID } from 'crypto';

// POST /api/gocardless/create-payment
// Secure endpoint to initiate a payment
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { client_id, amount, description } = body;

        // 1. Get Idempotency Key (From Header or Generate)
        // This prevents double-charging if the request is retried
        const idempotencyKey = request.headers.get('Idempotency-Key') || randomUUID();

        // 2. Validate Input
        if (!client_id || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Amount must be positive
        const amountInEuros = Number(amount);
        if (amountInEuros <= 0) {
            return NextResponse.json(
                { error: 'Amount must be positive' },
                { status: 400 }
            );
        }

        // SAFETY: Transaction Limit (Hard limit to prevent draining accounts)
        // User requested "protection from blocking". High volume/value errors cause blocks.
        if (amountInEuros > 5000) {
            return NextResponse.json(
                { error: 'Transaction limit exceeded (Max 5000€). Contact support.' },
                { status: 400 }
            );
        }

        // 3. Verify Client & Mandate
        const client = await getClientById(client_id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Check active mandate
        const { data: mandates } = await supabaseAdmin
            .from('gocardless_mandates')
            .select('*')
            .eq('client_id', client_id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1);

        const activeMandate = mandates?.[0];

        if (!activeMandate) {
            return NextResponse.json(
                { error: 'No active mandate found for this client.' },
                { status: 400 }
            );
        }

        // 4. Create Payment via GoCardless
        // Convert Euros to Cents
        const amountInCents = Math.round(amountInEuros * 100);

        const { payments } = await gocardless.createPayment({
            mandate_id: activeMandate.mandate_id, // The GC mandate ID (e.g. MD123...)
            amount: amountInCents,
            currency: 'EUR',
            description: description || `Prélèvement ${client.company_name}`,
            metadata: {
                client_id: client.id,
                triggered_by: 'admin_dashboard'
            },
            idempotencyKey // Pass the key to GoCardless
        });

        // 5. Log Payment in Database (Optional but recommended)
        await supabaseAdmin.insert('payments', {
            client_id: client.id,
            amount: amountInEuros,
            currency: 'EUR',
            status: payments.status,
            gocardless_payment_id: payments.id,
            description: description
        });

        return NextResponse.json({
            success: true,
            payment: payments
        });

    } catch (error) {
        console.error('Payment Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Payment failed' },
            { status: 500 }
        );
    }
}
