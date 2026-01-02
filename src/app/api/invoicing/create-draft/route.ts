
import { NextRequest, NextResponse } from 'next/server';
import { zoho } from '@/lib/invoicing/zoho';
import { supabaseAdmin } from '@/lib/db/supabase';

// POST /api/invoicing/create-draft
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { report_id, report_data } = body;

        console.log(`Generating invoice draft for report ${report_id}`);

        // 1. Get Client Details for Zoho Contact
        // In a real scenario, we'd fetch from DB, but here we might pass it or fetch
        // Let's assume we fetch client details if report has client_id
        let clientDetails = report_data.client_details;

        if (!clientDetails && report_data.client_name) {
            // Fallback minimal details
            clientDetails = {
                company_name: report_data.client_name,
                contact_name: report_data.client_name,
                email: 'billing@rivego.lu', // Placeholder if missing
            };
        }

        // 2. Get or Create Zoho Contact
        const contact = await zoho.getOrCreateContact({
            ...clientDetails,
            email: clientDetails.email || 'billing@rivego.lu'
        });

        // 3. Prepare Line Items
        const commissionAmount = report_data.commission_amount;
        const taxPercentage = 17;

        let itemName = 'Commission sur ventes';
        if (report_data.commission_percentage && report_data.commission_percentage > 0) {
            itemName = `Commission sur ventes (${report_data.commission_percentage}%)`;
        } else {
            itemName = 'Forfait système de commande';
        }

        // 4. Create Invoice in Zoho (Draft)
        const { invoice } = await zoho.createInvoice({
            customer_id: contact.contact_id,
            date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days terms
            notes: `Commission sur ventes du mois de ${report_data.month}. CA: ${report_data.turnover}€`,
            terms: 'Paiement à 15 jours.',
            is_draft: true,
            line_items: [
                {
                    name: itemName,
                    description: `Commission sur CA de ${report_data.turnover}€ pour ${report_data.month}`,
                    rate: commissionAmount,
                    quantity: 1,
                    tax_percentage: taxPercentage
                }
            ]
        });

        // 5. Update Local DB (if reports were real)
        // For now, we return success

        return NextResponse.json({
            success: true,
            invoice_id: invoice.invoice_id,
            invoice_number: invoice.invoice_number,
            status: 'draft'
        });

    } catch (error) {
        console.error('Invoice Generation Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create invoice' },
            { status: 500 }
        );
    }
}
