
import { NextRequest, NextResponse } from 'next/server';
import { zoho, ZohoInvoiceLineItem } from '@/lib/invoicing/zoho';
import { supabaseAdmin } from '@/lib/db/supabase';

// POST /api/invoicing/create-quote
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { client_data, quote_data } = body;

        // 1. Sync Client to Zoho
        console.log(`Syncing client ${client_data.email} to Zoho for Quote...`);
        const contact = await zoho.getOrCreateContact({
            email: client_data.email,
            company_name: client_data.company_name || client_data.contact_name, // Fallback if no company
            contact_name: client_data.contact_name,
            phone: client_data.phone,
            address: client_data.address,
            // Assuming we might parse address components if available, otherwise just passing raw
            vat_number: client_data.vat_number,
        });
        console.log(`Zoho Contact ID: ${contact.contact_id}`);

        // Update local client with zoho_id if it exists
        // (Optional: we might want to find the client in our DB first)
        // For now, assuming this is loosely coupled or triggered from Admin UI which has client info.

        // 2. Prepare Line Items
        const line_items: ZohoInvoiceLineItem[] = quote_data.items.map((item: any) => {
            // Zoho expects tax_id or tax_percentage.
            // If VAT is 17%, we need to find the Tax ID for 17% or just pass percentage if allowed (Zoho usually prefers Tax ID or percentage if configured).
            // We'll try passing tax_percentage first.
            return {
                name: item.name,
                description: item.description,
                rate: item.unit_price,
                quantity: item.quantity,
                tax_percentage: quote_data.vat_rate, // e.g. 17 or 0
            };
        });

        // 3. Create Estimate (Quote) in Zoho
        console.log('Creating Estimate in Zoho...');
        const { estimate } = await zoho.createEstimate({
            customer_id: contact.contact_id,
            date: quote_data.date, // YYYY-MM-DD
            expiry_date: quote_data.valid_until,
            line_items: line_items,
            notes: quote_data.notes,
            terms: quote_data.payment_terms,
            reference_number: quote_data.quote_number,
            discount: quote_data.discount_amount, // or percentage if supported
            is_discount_before_tax: true, // Usual practice
            discount_type: 'entity_level',
        });

        console.log(`Estimate Created: ${estimate.estimate_number} (${estimate.estimate_id})`);

        return NextResponse.json({
            success: true,
            zoho_estimate_id: estimate.estimate_id,
            zoho_estimate_number: estimate.estimate_number,
            contact_id: contact.contact_id
        });

    } catch (error) {
        console.error('Error creating Zoho estimate:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create estimate' },
            { status: 500 }
        );
    }
}
