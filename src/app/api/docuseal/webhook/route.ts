
import { NextRequest, NextResponse } from 'next/server';
import { zoho } from '@/lib/invoicing/zoho';
import { docuSeal } from '@/lib/docuseal';

// POST /api/docuseal/webhook
export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();

        // Check for 'submission.completed' event
        if (payload.event_type !== 'submission.completed') {
            return NextResponse.json({ message: 'Event ignored' });
        }

        const submission = payload.data;
        const documents = submission.documents || [];

        console.log(`DocuSeal Submission Completed: ${submission.id}`);

        for (const doc of documents) {
            // Document name format: Devis_DEV-202601-123.pdf
            const filename = doc.name;
            const match = filename.match(/Devis_(DEV-\d+-\d+)/);

            if (match && match[1]) {
                const quoteNumber = match[1];
                console.log(`Processing signed quote: ${quoteNumber}`);

                // 1. Find Estimate in Zoho
                // Since we don't have the ID, we might need to search or list (API filtering?)
                // Zoho API supports filtering by estimate_number
                // But zoho.ts doesn't have a searchEstimate method yet.
                // We'll implement a fallback if search isn't possible: List and filter? Or maybe assume we stored the ID somewhere?
                // Actually, Zoho supports /estimates?estimate_number=XYZ

                // Let's add findEstimateByNumber to zoho.ts or use request directly.
                // For now, let's assume we can search.

                try {
                    // Search for the estimate
                    console.log(`Searching for Zoho Estimate: ${quoteNumber}`);
                    const { estimates } = await zoho.findEstimateByNumber(quoteNumber);

                    if (estimates && estimates.length > 0) {
                        const estimateId = estimates[0].estimate_id;
                        console.log(`Found Estimate ID: ${estimateId}. Marking as Accepted...`);

                        await zoho.acceptEstimate(estimateId);
                        console.log(`Zoho Estimate ${quoteNumber} accepted successfully.`);
                    } else {
                        console.warn(`Zoho Estimate ${quoteNumber} not found.`);
                    }

                } catch (zohoError) {
                    console.error(`Failed to update Zoho for quote ${quoteNumber}:`, zohoError);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DocuSeal Webhook Error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
