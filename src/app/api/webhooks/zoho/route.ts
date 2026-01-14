
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function POST(request: NextRequest) {
    try {
        console.log('Zoho Webhook received');

        // Zoho sends data as URL Encoded Form Data or JSON depending on config.
        // Usually it's JSON in the body or a 'JSONString' parameter in form data.
        // We will try to parse JSON first.
        let payload: any = {};
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            payload = await request.json();
        } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const jsonString = formData.get('JSONString');
            if (jsonString && typeof jsonString === 'string') {
                payload = JSON.parse(jsonString);
            }
        }

        console.log('Zoho Payload:', JSON.stringify(payload, null, 2));

        // Expected Payload structure from Zoho Books for Invoice:
        // { "invoice": { "invoice_id": "...", "status": "sent" | "paid", "invoice_number": "..." } }

        const invoiceData = payload.invoice;
        if (!invoiceData) {
            return NextResponse.json({ message: 'No invoice data found' }, { status: 200 }); // Return 200 to acknowledge
        }

        const zohoId = invoiceData.invoice_id;
        const status = invoiceData.status; // 'sent', 'paid', 'void', 'draft'

        if (zohoId && status) {
            // Map Zoho status to Local status
            let localStatus = 'draft';
            if (status === 'sent' || status === 'viewed') localStatus = 'sent';
            if (status === 'paid') localStatus = 'paid';
            if (status === 'void') localStatus = 'cancelled';
            if (status === 'overdue') localStatus = 'overdue';

            // Update local database
            const { error } = await supabaseAdmin.update('invoices', `external_id=eq.${zohoId}`, {
                status: localStatus,
                updated_at: new Date().toISOString()
            });

            if (error) console.error('Error updating local invoice:', error);
            else console.log(`Synced Invoice ${invoiceData.invoice_number} status to ${localStatus}`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
