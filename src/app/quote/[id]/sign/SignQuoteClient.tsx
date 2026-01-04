'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    CheckCircle,
    Download,
    FileText,
    Clock,
    Loader2,
    Smartphone,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { DocusealForm } from '@docuseal/react';

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
    monthlyTotal: 25, // Mock monthly total if needed
};

// Define Quote type locally if not imported or ensure flexible type
type Quote = typeof demoQuote;

export default function SignQuoteClient({ demoQuote: initialQuote }: { demoQuote?: Quote }) {
    const params = useParams();
    const quoteId = params.id as string;

    const [quote] = useState(initialQuote || demoQuote);
    const [signed, setSigned] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showMobileModal, setShowMobileModal] = useState(false);
    const [currentUrl, setCurrentUrl] = useState('');

    // State for dynamic DocuSeal session
    const [loadingSrc, setLoadingSrc] = useState(true);
    const [docuSealSrc, setDocuSealSrc] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUrl(window.location.href);
        }
    }, []);

    // Helper to prepare contract data
    const getContractData = () => {
        const totalHt = quote.total;
        const vatRate = 0.17;
        const vatAmount = totalHt * vatRate;
        const totalTtc = totalHt + vatAmount;

        const monthlyHt = 25.00;
        const monthlyTtc = monthlyHt * 1.17;

        // Use separate items lists if available in real data, otherwise mock splitting
        const oneTimeItems = [
            { description: 'Site Business', quantity: 1, unitPrice: 599, total: 599 },
            { description: 'Photos en présentiel', quantity: 1, unitPrice: 60, total: 60 },
            { description: 'Menu digital sur le site', quantity: 1, unitPrice: 40, total: 40 },
            { description: 'Site multi-langues', quantity: 1, unitPrice: 30, total: 30 },
            { description: 'Imprimante (reconditionné)', quantity: 1, unitPrice: 150, total: 150 },
            { description: 'Router pour imprimante', quantity: 1, unitPrice: 40, total: 40 },
        ];

        const monthlyItems = [
            { description: 'Hébergement & Maintenance (mensuel)', quantity: 1, unitPrice: 25, total: 25 },
            { description: 'Système commande en ligne (mensuel)', quantity: 1, unitPrice: 60, total: 60 },
            { description: 'Retouche photos qualité studio (IA) (mensuel)', quantity: 1, unitPrice: 60, total: 60 },
            { description: 'Réservation de table (mensuel)', quantity: 1, unitPrice: 10, total: 10 },
            { description: 'Chatbot site web (mensuel)', quantity: 1, unitPrice: 25, total: 25 },
            { description: 'Traduction avis & affichage (mensuel)', quantity: 1, unitPrice: 9, total: 9 },
        ];

        return {
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
            clientVat: '',
            serviceName: quote.service.name,
            planName: quote.service.plan,
            planDescription: quote.service.description,
            oneTimeItems: oneTimeItems,
            monthlyItems: monthlyItems,
            oneTimeTotal: 919.00, // Mock calc
            monthlyTotal: 189.00, // Mock calc
            vatRate: 17,
            vatAmount: 156.23, // Mock calc
            totalTtc: 1075.23, // Mock calc
            depositPercent: 50,
            depositAmount: 537.62,
            paymentTerms: 'Acompte de 50% (537.62€) à la signature. Solde à la livraison.',
            notes: 'Aucune note complémentaire.',
            signedDate: undefined,
            signatureImage: undefined,
        };
    };

    // Initialize DocuSeal with Generated PDF
    useEffect(() => {
        const initDocuSeal = async () => {
            try {
                setLoadingSrc(true);
                setError(null);

                // 1. Generate PDF Blob
                console.log('Generating PDF...');
                const { generateQuotePDF } = await import('@/components/pdf/QuotePDF');
                const contractData = getContractData();
                const pdfBlob = await generateQuotePDF(contractData);
                console.log('PDF Blob size:', pdfBlob.size, 'bytes');

                if (!pdfBlob || pdfBlob.size === 0) {
                    throw new Error('PDF generation failed - empty blob');
                }

                // 2. Convert Blob to Base64
                const base64data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result?.toString().split(',')[1];
                        if (result) {
                            resolve(result);
                        } else {
                            reject(new Error('Failed to convert PDF to base64'));
                        }
                    };
                    reader.onerror = () => reject(new Error('FileReader error'));
                    reader.readAsDataURL(pdfBlob);
                });

                console.log('Base64 length:', base64data.length);

                // 3. Call API to create signing session
                const response = await fetch('/api/docuseal/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        documents: [{
                            name: `Devis-${quote.id}.pdf`,
                            file: base64data
                        }],
                        email: quote.client.email,
                        name: quote.client.name
                    })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Failed to init DocuSeal');
                }

                const data = await response.json();
                console.log('DocuSeal response:', data);
                setDocuSealSrc(`https://docuseal.com/s/${data.slug}`);
                setLoadingSrc(false);
            } catch (err: any) {
                console.error('Error initializing DocuSeal:', err);
                // Show error but also offer fallback
                setError(`${err.message}. Vous pouvez utiliser le modèle standard à la place.`);
                setDocuSealSrc("https://docuseal.com/d/NaZif3BS7bNSkn"); // Fallback URL
                setLoadingSrc(false);
            }
        };

        if (!signed) {
            initDocuSeal();
        }
    }, [quote, signed]);

    const router = useRouter();

    const handleSignComplete = (data: any) => {
        console.log('Signature completed:', data);
        setSigned(true);
        // Redirect to success page for next steps - Force top level redirect in case of iframe
        if (typeof window !== 'undefined') {
            window.top!.location.href = `/quote/${quoteId}/success`;
        }
    };

    const handleDownloadContract = async () => {
        // Download the FINAL signed PDF from DocuSeal if possible, 
        // OR generate a local copy with the signature image if we had it.
        // For now, regenerating the cleaner local PDF as before.
        const { generateQuotePDF } = await import('@/components/pdf/QuotePDF');
        const contractData = getContractData();
        // contractData.signedDate = ... // In a real app we'd get these from the webhook/callback data

        const blob = await generateQuotePDF(contractData);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devis-${quote.id}-signed.pdf`;
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
                        Une copie vous a été envoyée par email.
                    </p>

                    <button onClick={handleDownloadContract} className="btn btn-primary">
                        <FileText size={20} />
                        Télécharger le devis signé
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen pt-32 pb-12 bg-gray-50">
            {showMobileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowMobileModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center" onClick={e => e.stopPropagation()}>
                        <div className="mb-6">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Smartphone size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Signer sur mobile</h3>
                            <p className="text-gray-500 mt-2">Scannez ce QR code pour ouvrir le contrat sur votre smartphone.</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 inline-block mb-6">
                            <QRCodeSVG value={currentUrl} size={200} />
                        </div>

                        <button
                            onClick={() => setShowMobileModal(false)}
                            className="w-full btn btn-secondary"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-6 max-w-4xl">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Signer votre devis</h1>
                        <p className="text-gray-500">Devis N° {quote.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowMobileModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Smartphone size={16} />
                            Signer sur mobile
                        </button>
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                            <Clock size={16} />
                            Expire le {quote.validUntil}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Simplified Recap */}
                    <div className="card h-fit">
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
                                <p className="text-xs text-gray-400 mt-1">Dont TVA (17%)</p>
                            </div>
                        </div>
                    </div>

                    {/* DocuSeal Form - Dynamic Loading */}
                    <div className="card min-h-[400px] flex items-center justify-center bg-white p-0 overflow-hidden relative">
                        {error ? (
                            <div className="p-8 text-center text-red-500">
                                <p>Erreur: {error}</p>
                            </div>
                        ) : loadingSrc ? (
                            <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                                <Loader2 size={32} className="animate-spin mb-4 text-[#0D7377]" />
                                <p>Génération du contrat en cours...</p>
                            </div>
                        ) : (
                            <div className="w-full h-full min-h-[600px]">
                                <DocusealForm
                                    src={docuSealSrc || ''}
                                    email={quote.client.email}
                                    onComplete={handleSignComplete}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
