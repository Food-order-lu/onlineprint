import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { QuotePDF, QuoteData } from '@/components/pdf/QuotePDF';
import { createElement } from 'react';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = body as QuoteData;

        // Render the PDF to a stream
        const pdfStream = await renderToStream(createElement(QuotePDF, { data }));

        // Convert the stream to a Response
        // We need to construct a ReadableStream from the NodeJS stream returned by renderToStream
        const stream = new ReadableStream({
            start(controller) {
                pdfStream.on('data', (chunk) => controller.enqueue(chunk));
                pdfStream.on('end', () => controller.close());
                pdfStream.on('error', (err) => controller.error(err));
            },
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Devis-${data.quoteNumber || 'Generated'}.pdf"`,
            },
        });

    } catch (error) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate PDF', details: String(error) },
            { status: 500 }
        );
    }
}
