
import { NextRequest, NextResponse } from 'next/server';
import { generateContractPDF } from '@/components/pdf/ContractPDF';
import { getClientById, getQuoteById, supabaseAdmin } from '@/lib/db/supabase';

// POST /api/clients/[id]/generate-contract
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Correct Next.js 15 route param type
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { quoteId } = body; // Optional: specify which quote to base contract on

        const client = await getClientById(id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Mock data logic if no quoteId provided, or fetch quote
        let contractData: any = {
            companyName: 'RIVEGO Trade and Marketing Group S.à r.l.-S',
            companyAddress: '7, rue Jean-Pierre Sauvage, L-2514 Kirchberg',
            companyRcs: 'B257577',
            companyVat: 'LU35916651',
            companyEmail: 'contact@rivego.lu',
            companyPhone: '+352 691 123 456',

            clientType: client.client_type === 'new' ? 'Nouveau Client' : 'Client Existant',
            clientCompany: client.company_name,
            clientName: client.contact_name,
            clientAddress: client.address || 'Adresse non renseignée',
            clientEmail: client.email,
            clientPhone: client.phone || '',
            clientVat: client.vat_number || '',

            serviceName: 'Formule Business',
            planName: 'Pack Digital Complet',
            planDescription: 'Site web vitrine + Module commande en ligne + Hébergement',

            oneTimeTotal: '0.00',
            oneTimeAmountTtc: '0.00',
            monthlyAmount: client.subscriptions.reduce((sum, s) => sum + s.monthly_amount, 0).toFixed(2),
            monthlyAmountTtc: (client.subscriptions.reduce((sum, s) => sum + s.monthly_amount, 0) * 1.17).toFixed(2),

            discountPercent: 0,
            discountEuros: 0,
            discountAmount: '0.00',

            paymentTerms: 'Prélèvement SEPA Mensuel',
            depositPercentage: 0,
            depositAmount: '0.00',

            contractNumber: `CTR-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
            signedDate: new Date().toLocaleDateString('fr-FR'),
        };

        // If we have a quote, override with quote data (better accuracy)
        if (quoteId) {
            const quote = await getQuoteById(quoteId);
            if (quote) {
                // Parse items to separate One-Time vs Monthly
                const oneTimeItems = quote.items.filter((i: any) => !i.is_recurring);
                const monthlyItems = quote.items.filter((i: any) => i.is_recurring);

                const oneTimeSum = oneTimeItems.reduce((sum: number, i: any) => sum + i.total, 0);
                const monthlySum = monthlyItems.reduce((sum: number, i: any) => sum + i.total, 0);

                contractData = {
                    ...contractData,
                    serviceName: 'Prestations Digitales', // Generic
                    planName: 'Sur Mesure',
                    planDescription: quote.items.map((i: any) => i.description).join(', '),

                    oneTimeTotal: oneTimeSum.toFixed(2),
                    oneTimeAmountTtc: (oneTimeSum * 1.17).toFixed(2), // Simplification: assuming uniform VAT
                    monthlyAmount: monthlySum.toFixed(2),
                    monthlyAmountTtc: (monthlySum * 1.17).toFixed(2),

                    contractNumber: `CTR-${quote.quote_number}`,
                    signedDate: quote.signed_at
                        ? new Date(quote.signed_at).toLocaleDateString('fr-FR')
                        : new Date().toLocaleDateString('fr-FR'),
                };
            }
        }

        // Generate PDF
        const pdfBlob = await generateContractPDF(contractData);

        // Convert Blob to Buffer
        const buffer = Buffer.from(await pdfBlob.arrayBuffer());

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Contrat-${client.company_name}.pdf"`,
            },
        });

    } catch (error) {
        console.error('Contract generation error:', error);
        return NextResponse.json({ error: 'Failed to generate contract' }, { status: 500 });
    }
}
