
import { NextRequest, NextResponse } from 'next/server';
import { docuSeal } from '@/lib/docuseal';

// POST /api/invoicing/sign-docuseal
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { pdf_base64, client_email, client_name, quote_number } = body;

        if (!pdf_base64 || !client_email) {
            return NextResponse.json(
                { error: 'Missing PDF or Client Email' },
                { status: 400 }
            );
        }

        console.log(`Initiating DocuSeal Session for Quote ${quote_number} (${client_email})...`);

        // Create submission directly with the PDF
        // initSigningSession will auto-create a template if needed
        const submission = await docuSeal.initSigningSession({
            email: client_email,
            name: client_name || 'Client',
            documents: [{
                name: `Devis_${quote_number}.pdf`,
                file: pdf_base64,
                // Optional: We can specify fields here or let DocuSeal auto-detect if we didn't use the helper
                // The helper in lib/docuseal.ts (createTemplateFromPdf) enables Signature and Date fields manually.
            }],
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://platform.rivego.lu'}/admin`
        });

        // submission response usually contains the 'slug' or an array of submitters with 'slug'
        // Let's check the structure returned by docuSeal.createSubmission
        // Usually returns [ { id, slug, ... } ] or similar.
        console.log('DocuSeal Submission Response:', submission);

        // Get the signing URL from the response - embed_src contains the full correct URL
        const signingUrl = submission[0]?.embed_src || `https://docuseal.eu/s/${submission[0]?.slug}`;
        const slug = submission[0]?.slug || submission.slug;

        if (!signingUrl && !slug) {
            throw new Error('No signing URL or slug returned from DocuSeal');
        }

        return NextResponse.json({
            success: true,
            url: signingUrl,
            slug: slug
        });

    } catch (error) {
        console.error('DocuSeal API Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'DocuSeal failed' },
            { status: 500 }
        );
    }
}
