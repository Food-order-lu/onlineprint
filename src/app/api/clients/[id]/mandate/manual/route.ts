
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Updated for Next.js 15+ Params
) {
    try {
        const clientId = (await context.params).id;
        const body = await request.json();
        const { iban, bic, account_holder } = body;

        if (!iban) {
            return NextResponse.json(
                { error: 'IBAN is required' },
                { status: 400 }
            );
        }

        // 1. Create manual mandate record
        const { data: mandates, error } = await supabaseAdmin.insert('mandates', {
            client_id: clientId,
            mandate_id: `MANUAL_${Date.now()}`,
            status: 'active',
            iban_last4: iban.slice(-4),
            bank_name: 'Manuel', // We could try to detect from IBAN but 'Manuel' is fine
            created_at: new Date().toISOString(),
        });

        const mandate = mandates ? mandates[0] : null;

        if (error) throw error;

        // 2. Log activity
        console.log(`Manual mandate created for client ${clientId}: ${iban.slice(-4)}`);

        return NextResponse.json({ success: true, mandate });

    } catch (error: any) {
        console.error('Error creating manual mandate:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
