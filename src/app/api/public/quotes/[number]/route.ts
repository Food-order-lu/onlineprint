
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

interface RouteParams {
    params: Promise<{ number: string }>;
}

import { docuSeal } from '@/lib/docuseal';

// Public API to get quote status/client ID for success page
// GET /api/public/quotes/[number]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { number } = await params;
        console.log(`[PublicAPI] Searching for quote number: "${number}"`);

        // Fetch basic quote info
        const { data: quote, error } = await supabaseAdmin.selectOne<any>(
            'quotes',
            `quote_number=eq.${number}`
        );

        if (error) {
            console.error(`[PublicAPI] Error finding quote ${number}:`, error);
        }

        if (!quote) {
            console.warn(`[PublicAPI] Quote ${number} not found in DB.`);
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        // ACTIVE VERIFICATION (Fallback for Webhooks)
        if (quote.status === 'sent' && quote.signature_data) {
            try {
                let sigData;
                try { sigData = JSON.parse(quote.signature_data); } catch (e) { sigData = {}; }

                if (sigData && sigData.slug) {
                    // Check DocuSeal status
                    const submission = await docuSeal.getSubmission(sigData.slug);

                    if (submission && submission.status === 'completed') {
                        console.log(`[PublicAPI] Verified signed status for ${number}. Updating DB...`);
                        const completedAt = submission.completed_at || new Date().toISOString();

                        // Update status in DB
                        await supabaseAdmin.update('quotes', `id=eq.${quote.id}`, {
                            status: 'signed',
                            signed_at: completedAt
                        });

                        // Update local response
                        quote.status = 'signed';
                    }
                }
            } catch (verifErr) {
                console.error(`[PublicAPI] Verification failed:`, verifErr);
            }
        }

        // Return only necessary info
        return NextResponse.json({
            id: quote.id,
            quote_number: quote.quote_number,
            client_id: quote.client_id,
            status: quote.status
        });
    } catch (e) {
        console.error('Error fetching quote:', e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
