
import { NextRequest, NextResponse } from 'next/server';
import { docuSeal } from '@/lib/docuseal';

export const maxDuration = 60; // Increase timeout just in case


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { templateId, documents, email, name, redirect_url } = body;

        // Basic validation
        if ((!templateId && !documents) || !email) {
            return NextResponse.json(
                { error: 'Missing required fields: email and either templateId or documents' },
                { status: 400 }
            );
        }

        // Call DocuSeal wrapper
        const submission = await docuSeal.initSigningSession({
            templateId,
            documents,
            email,
            name,
            redirect_url
        });

        return NextResponse.json({
            success: true,
            slug: submission[0].slug,
            submission_id: submission[0].id
        });
    } catch (error: any) {
        console.error('DocuSeal Init API Error:', error);
        // Detailed error logging
        if (error.cause) console.error('Cause:', error.cause);

        return NextResponse.json(
            { error: error.message || 'Internal Server Error', details: error.toString() },
            { status: 500 }
        );
    }
}
