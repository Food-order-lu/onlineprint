import { NextRequest, NextResponse } from 'next/server';
import { sendQuoteToClient, sendSignatureConfirmation, notifyTeam, type QuoteEmailData } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, quoteData } = body as {
            action: 'send_quote' | 'confirm_signature';
            quoteData: QuoteEmailData
        };

        if (!action || !quoteData) {
            return NextResponse.json(
                { error: 'Missing action or quoteData' },
                { status: 400 }
            );
        }

        const results: Record<string, { success: boolean; messageId?: string; error?: string }> = {
            clientEmail: { success: false },
            teamNotification: { success: false },
        };

        if (action === 'send_quote') {
            // Send quote to client
            const clientResult = await sendQuoteToClient(quoteData);
            results.clientEmail = clientResult;

            // Notify team
            const teamResult = await notifyTeam(quoteData, 'created');
            results.teamNotification = teamResult;

        } else if (action === 'confirm_signature') {
            // Send confirmation to client
            const clientResult = await sendSignatureConfirmation(quoteData);
            results.clientEmail = clientResult;

            // Notify team of signature
            const teamResult = await notifyTeam(quoteData, 'signed');
            results.teamNotification = teamResult;
        }

        return NextResponse.json({
            success: true,
            results,
        });

    } catch (error) {
        console.error('Email API error:', error);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        );
    }
}
