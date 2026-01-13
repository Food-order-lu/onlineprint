import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getClientById } from '@/lib/db/supabase';
import { zoho } from '@/lib/invoicing/zoho';

interface OneTimeCharge {
    id: string;
    client_id: string;
    description: string;
    amount: number;
    invoiced: boolean;
    created_at: string;
}

// POST /api/clients/[id]/generate-final-invoice
// Generate final invoice with deposit deduction
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clientId } = await params;
        const body = await request.json().catch(() => ({}));
        const { deposit_amount, deposit_invoice_number } = body;

        // 1. Get client
        const client = await getClientById(clientId);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        if (!client.zoho_contact_id) {
            return NextResponse.json({ error: 'Client not synced to Zoho' }, { status: 400 });
        }

        // 2. Get pending one-time charges
        const { data: charges } = await supabaseAdmin.select<OneTimeCharge>(
            'one_time_charges',
            `client_id=eq.${clientId}&invoiced=eq.false&order=created_at.asc`
        );

        if (!charges || charges.length === 0) {
            return NextResponse.json({ error: 'No pending charges found' }, { status: 400 });
        }

        // 3. Calculate totals
        const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0);
        const depositPaid = deposit_amount || 0;
        const balanceAmount = totalCharges - depositPaid;

        // 4. Prepare line items for Zoho
        const lineItems = charges.map(charge => ({
            name: charge.description,
            rate: charge.amount,
            quantity: 1
        }));

        // 5. Create invoice in Zoho
        let invoice;
        if (depositPaid > 0 && deposit_invoice_number) {
            // Use balance invoice with deposit deduction
            const result = await zoho.createBalanceInvoice({
                customer_id: client.zoho_contact_id,
                original_total: totalCharges,
                deposit_paid: depositPaid,
                line_items: lineItems,
                deposit_invoice_number: deposit_invoice_number,
                reference: `Solde - ${client.company_name}`
            });
            invoice = result.invoice;
        } else {
            // Regular invoice without deposit deduction
            const result = await zoho.createInvoice({
                customer_id: client.zoho_contact_id,
                line_items: lineItems,
                notes: `Facture pour ${client.company_name}`,
                is_draft: true
            });
            invoice = result.invoice;
        }

        // 6. Mark charges as invoiced
        for (const charge of charges) {
            await supabaseAdmin.update(
                'one_time_charges',
                `id=eq.${charge.id}`,
                { invoiced: true, updated_at: new Date().toISOString() }
            );
        }

        // 7. Create local invoice record
        await supabaseAdmin.insert('invoices', {
            client_id: clientId,
            invoice_number: invoice.invoice_number,
            external_id: invoice.invoice_id,
            external_provider: 'zoho',
            amount: balanceAmount,
            status: 'draft',
            due_date: invoice.due_date,
            created_at: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            invoice: {
                id: invoice.invoice_id,
                number: invoice.invoice_number,
                total: invoice.total,
                balance: balanceAmount,
                deposit_deducted: depositPaid
            },
            charges_invoiced: charges.length
        });

    } catch (error: any) {
        console.error('Generate final invoice error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET /api/clients/[id]/generate-final-invoice
// Preview what would be invoiced
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clientId } = await params;

        // Get pending charges
        const { data: charges } = await supabaseAdmin.select<OneTimeCharge>(
            'one_time_charges',
            `client_id=eq.${clientId}&invoiced=eq.false&order=created_at.asc`
        );

        const totalCharges = (charges || []).reduce((sum, c) => sum + c.amount, 0);

        // Get recent invoices to find deposit invoice
        const { data: invoices } = await supabaseAdmin.select<any>(
            'invoices',
            `client_id=eq.${clientId}&status=eq.paid&order=created_at.desc&limit=5`
        );

        // Look for deposit invoice (usually contains "acompte" in description or notes)
        const depositInvoice = invoices?.find((inv: any) =>
            inv.invoice_number?.toLowerCase().includes('acompte') ||
            inv.notes?.toLowerCase().includes('acompte')
        );

        return NextResponse.json({
            pending_charges: charges || [],
            total_charges: totalCharges,
            deposit_invoice: depositInvoice ? {
                number: depositInvoice.invoice_number,
                amount: depositInvoice.amount
            } : null,
            estimated_balance: totalCharges - (depositInvoice?.amount || 0)
        });

    } catch (error: any) {
        console.error('Preview final invoice error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
