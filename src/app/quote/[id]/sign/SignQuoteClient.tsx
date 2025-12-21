'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
    CheckCircle,
    Download,
    Eye,
    ChevronRight,
    PenTool,
    RotateCcw,
    FileText,
    Clock,
} from 'lucide-react';
import SignaturePad from '@/components/signature/SignaturePad';

// Demo quote data - in production, this would come from a database/API
const demoQuote = {
    id: 'DEV-202412-001',
    createdAt: '18/12/2024',
    validUntil: '18/01/2025',
    status: 'pending',
    company: {
        name: 'RIVEGO Trade and Marketing Group S.à r.l.-S',
        address: '7, rue Jean-Pierre Sauvage, L-2514 Kirchberg',
        email: 'formulaire@webvision.lu',
    },
    client: {
        name: 'Jean Dupont',
        company: 'Restaurant Le Gourmet',
        address: '123 Rue de la Gare, L-1234 Luxembourg',
        email: 'contact@legourmet.lu',
        phone: '+352 123 456 789',
    },
    service: {
        name: 'WebVision',
        plan: 'Business',
        description: 'Site complet avec fonctionnalités avancées',
    },
    items: [
        { description: 'Site Business', quantity: 1, price: 599, total: 599 },
        { description: 'Hébergement & Maintenance (mensuel)', quantity: 1, price: 25, total: 25 },
    ],
    subtotal: 624,
    discountPercent: 0,
    discountAmount: 0,
    total: 624,
};

export default function SignQuoteClient() {
    const params = useParams();
    const quoteId = params.id as string;

    const [quote] = useState(demoQuote);
    const [signature, setSignature] = useState<string | null>(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [signed, setSigned] = useState(false);

    const handleSign = async () => {
        if (!signature || !acceptedTerms) return;

        setSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log('Quote signed:', {
            quoteId,
            signature,
            signedAt: new Date().toISOString(),
        });

        setSigned(true);
        setSubmitting(false);
    };

    const handleDownloadPDF = async () => {
        const { generateQuotePDF } = await import('@/components/pdf/QuotePDF');

        const pdfData = {
            quoteNumber: quote.id,
            quoteDate: quote.createdAt,
            validUntil: quote.validUntil,
            companyName: quote.company.name,
            companyAddress: quote.company.address,
            companyVat: 'LU35916651',
            companyEmail: quote.company.email,
            clientName: quote.client.name,
            clientCompany: quote.client.company,
            clientAddress: quote.client.address,
            clientEmail: quote.client.email,
            clientPhone: quote.client.phone,
            serviceName: quote.service.name,
            planName: quote.service.plan,
            planDescription: quote.service.description,
            lineItems: quote.items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.price,
                total: item.total,
            })),
            subtotal: quote.subtotal,
            discountPercent: quote.discountPercent,
            discountAmount: quote.discountAmount,
            total: quote.total, // HT
            vatRate: 17,
            vatAmount: quote.total * 0.17,
            totalTtc: quote.total * 1.17,
            depositAmount: (quote.total * 1.17) * 0.20,
            showDeposit: true,
            paymentTerms: 'Acompte de 20% à la signature. Solde à la livraison.',
            notes: 'Devis signé électroniquement',
            signatureImage: signature || undefined,
            signedDate: new Date().toLocaleDateString('fr-FR'),
        };

        const blob = await generateQuotePDF(pdfData);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devis-${quote.id}-signe.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadContract = async () => {
        const { generateContractPDF } = await import('@/components/pdf/ContractPDF');

        const contractData = {
            contractNumber: quote.id,
            contractDate: new Date().toLocaleDateString('fr-FR'),
            companyName: quote.company.name,
            companyAddress: quote.company.address,
            companyVat: 'LU35916651',
            clientName: quote.client.name,
            clientCompany: quote.client.company,
            clientAddress: quote.client.address,
            clientVat: '',
            serviceName: quote.service.name,
            planName: quote.service.plan,
            totalAmountTtc: quote.total * 1.17,
            monthlyAmount: 25,
            durationMonths: 12,
            signatureImage: signature || undefined,
            signedDate: new Date().toLocaleDateString('fr-FR'),
        };

        const blob = await generateContractPDF(contractData);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contrat-${quote.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (signed) {
        return (
            <section className="min-h-screen flex items-center justify-center py-32 bg-gray-50">
                <div className="container mx-auto px-6 text-center max-w-lg">
                    <div className="inline-flex p-6 rounded-full bg-green-100 mb-8">
                        <CheckCircle size={64} className="text-green-600" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4 text-gray-900">Devis signé !</h1>
                    <p className="text-gray-600 text-lg mb-8">
                        Merci ! Votre devis N° {quote.id} a été signé avec succès.
                        Vous recevrez une confirmation par email.
                    </p>

                    <div className="card text-left">
                        <h3 className="font-semibold text-gray-900 mb-4">Prochaines étapes</h3>
                        <ol className="space-y-3 text-gray-600 text-sm">
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-[#1A3A5C] text-white flex items-center justify-center text-xs shrink-0">1</span>
                                Vous recevrez une copie du devis signé et du contrat par email
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-[#1A3A5C] text-white flex items-center justify-center text-xs shrink-0">2</span>
                                Notre équipe vous contactera sous 24h
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-[#1A3A5C] text-white flex items-center justify-center text-xs shrink-0">3</span>
                                Le projet démarrera après réception de l&apos;acompte
                            </li>
                        </ol>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                        <button onClick={handleDownloadPDF} className="btn btn-secondary">
                            <Download size={20} />
                            Décharger le devis signé
                        </button>
                        <button onClick={handleDownloadContract} className="btn btn-primary">
                            <FileText size={20} />
                            Télécharger mon contrat
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen pt-32 pb-12 bg-gray-50">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Signer votre devis</h1>
                        <p className="text-gray-500">Devis N° {quote.id}</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                        <Clock size={16} />
                        Expire le {quote.validUntil}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Simplified Recap */}
                    <div className="card">
                        <h2 className="text-xl font-semibold mb-6">Récapitulatif</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Client</span>
                                <span className="font-medium text-right">{quote.client.company}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Service</span>
                                <span className="font-medium">{quote.service.name} - {quote.service.plan}</span>
                            </div>
                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex justify-between text-2xl font-bold text-[#0D7377]">
                                    <span>Total TTC</span>
                                    <span>{(quote.total * 1.17).toFixed(2)} €</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Dont TVA (17%) : {(quote.total * 0.17).toFixed(2)} €</p>
                            </div>
                        </div>
                    </div>

                    {/* Signature Pad */}
                    <div className="space-y-6">
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-6">Signature</h2>
                            <SignaturePad
                                onSign={(data) => setSignature(data)}
                                onClear={() => setSignature(null)}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="flex gap-3 cursor-pointer group">
                                <div className="mt-1">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-gray-300 text-[#1A3A5C] focus:ring-[#1A3A5C]"
                                        checked={acceptedTerms}
                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    />
                                </div>
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                    J&apos;ai lu et j&apos;accepte les conditions générales de vente et de prestation de services.
                                    Je reconnais que cette signature électronique a la même valeur légale qu&apos;une signature manuscrite.
                                </span>
                            </label>

                            <button
                                onClick={handleSign}
                                disabled={!signature || !acceptedTerms || submitting}
                                className="btn btn-primary w-full py-4 text-lg shadow-xl shadow-[#1A3A5C]/20"
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Signature en cours...
                                    </span>
                                ) : (
                                    'Signer et valider le devis'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
