
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

        // 2. Find Client in DB (required for OneTimeCharge)
        // We need the local UUID, not just Zoho ID
        let clientId = report_data.client_id;

        if (!clientId) {
            const { data: clients } = await supabaseAdmin
                .from('clients')
                .select('id')
                .eq('email', clientDetails.email || '')
                .single();

            if (clients) clientId = clients.id;
        }

        if (!clientId) {
            console.error(`Client not found for report ${report_id} (${clientDetails.email})`);
            return NextResponse.json(
                { error: 'Client not found in database. Cannot queue charge.' },
                { status: 404 }
            );
        }

        // 3. Prepare OneTimeCharge
        const commissionAmount = report_data.commission_amount;

        let description = 'Commission sur ventes';
        if (report_data.commission_percentage && report_data.commission_percentage > 0) {
            description = `Commission sur ventes (${report_data.commission_percentage}%) - ${report_data.month}`;
        } else {
            description = `Forfait système de commande - ${report_data.month}`;
        }

        if (report_data.turnover) {
            description += ` (CA: ${report_data.turnover}€)`;
        }

        // 4. Create OneTimeCharge (Pending)
        // This will be picked up by the cron job on the 7th
        const { data: charge, error: chargeError } = await supabaseAdmin.insert('one_time_charges', {
            client_id: clientId,
            description: description,
            amount: commissionAmount,
            invoiced: false,
            invoice_id: null,
            created_at: new Date().toISOString()
        }).select().single();

        if (chargeError) throw new Error(chargeError.message);

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
