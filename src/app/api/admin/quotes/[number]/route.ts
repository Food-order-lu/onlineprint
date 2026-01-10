// Get Quote Details API
// Path: /api/admin/quotes/[number]

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

interface RouteParams {
    params: Promise<{ number: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { number } = await params;

        // Fetch quote by quote_number using correct supabase client method
        const { data: quote, error } = await supabaseAdmin.selectOne<any>(
            'quotes',
            `quote_number=eq.${encodeURIComponent(number)}`
        );

        if (error || !quote) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        return NextResponse.json(quote);
    } catch (e) {
        console.error('Error fetching quote:', e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
