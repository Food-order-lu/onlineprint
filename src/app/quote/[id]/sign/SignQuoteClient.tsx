'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, Clock, Download } from 'lucide-react';
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
                                Vous recevrez une copie du devis signé par email
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

                    <button className="btn btn-primary mt-8">
                        <Download size={20} />
                        Télécharger le devis signé
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen pt-24 pb-12 bg-gray-50">
            <div className="container mx-auto px-6 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <span className="text-3xl font-bold text-[#1A3A5C]">RIVEGO</span>
                    <p className="text-gray-500 mt-1">Signature de devis</p>
                </div>

                {/* Quote Summary Card */}
                <div className="card mb-8">
                    <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-100">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Devis N° {quote.id}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Clock size={14} />
                                    Créé le {quote.createdAt}
                                </span>
                                <span>|</span>
                                <span>Valide jusqu&apos;au {quote.validUntil}</span>
                            </div>
                        </div>
                        <span className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
                            En attente de signature
                        </span>
                    </div>

                    {/* Parties */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">De</h3>
                            <p className="font-semibold text-gray-900 mb-2">{quote.company.name}</p>
                            <p className="text-sm text-gray-600">{quote.company.address}</p>
                            <p className="text-sm text-gray-600">{quote.company.email}</p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">À</h3>
                            <p className="font-semibold text-gray-900 mb-2">{quote.client.company}</p>
                            <p className="text-sm text-gray-600">{quote.client.name}</p>
                            <p className="text-sm text-gray-600">{quote.client.address}</p>
                        </div>
                    </div>

                    {/* Service */}
                    <div className="p-4 bg-[#0D7377] text-white rounded-xl mb-8">
                        <h3 className="font-semibold text-lg">{quote.service.name} - {quote.service.plan}</h3>
                        <p className="text-white/80 text-sm">{quote.service.description}</p>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto mb-8">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="text-left text-gray-500 text-sm font-medium px-4 py-3">Description</th>
                                    <th className="text-center text-gray-500 text-sm font-medium px-4 py-3">Qté</th>
                                    <th className="text-right text-gray-500 text-sm font-medium px-4 py-3">Prix unit.</th>
                                    <th className="text-right text-gray-500 text-sm font-medium px-4 py-3">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quote.items.map((item, index) => (
                                    <tr key={index} className="border-t border-gray-100">
                                        <td className="px-4 py-3 text-gray-900">{item.description}</td>
                                        <td className="px-4 py-3 text-gray-600 text-center">{item.quantity}</td>
                                        <td className="px-4 py-3 text-gray-600 text-right">{item.price.toFixed(2)} €</td>
                                        <td className="px-4 py-3 text-gray-900 font-medium text-right">{item.total.toFixed(2)} €</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-full md:w-64 space-y-2">
                            <div className="flex justify-between text-gray-600">
                                <span>Sous-total</span>
                                <span>{quote.subtotal.toFixed(2)} €</span>
                            </div>
                            {quote.discountPercent > 0 && (
                                <div className="flex justify-between text-red-500">
                                    <span>Remise ({quote.discountPercent}%)</span>
                                    <span>-{quote.discountAmount.toFixed(2)} €</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                                <span>Total</span>
                                <span className="text-[#0D7377]">{quote.total.toFixed(2)} €</span>
                            </div>
                            <p className="text-xs text-gray-500">TVA non applicable (Art. 293B CGI)</p>
                        </div>
                    </div>
                </div>

                {/* Signature Section */}
                <div className="card">
                    <h2 className="text-xl font-bold mb-6 text-gray-900">Signature du client</h2>

                    <SignaturePad
                        onSignatureChange={setSignature}
                        label="Signez dans le cadre ci-dessous"
                    />

                    {/* Terms acceptance */}
                    <label className="flex items-start gap-3 mt-6 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-[#1A3A5C] focus:ring-[#1A3A5C] mt-0.5"
                        />
                        <span className="text-sm text-gray-600">
                            En signant ce devis, j&apos;accepte les conditions générales de vente de RIVEGO T&M Group
                            et je confirme mon accord pour la réalisation des prestations décrites ci-dessus.
                        </span>
                    </label>

                    {/* Submit */}
                    <button
                        onClick={handleSign}
                        disabled={!signature || !acceptedTerms || submitting}
                        className="btn btn-primary w-full mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            'Signature en cours...'
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                Signer et accepter le devis
                            </>
                        )}
                    </button>

                    {(!signature || !acceptedTerms) && (
                        <p className="text-sm text-gray-500 text-center mt-4">
                            {!signature && 'Veuillez signer dans le cadre ci-dessus. '}
                            {!acceptedTerms && 'Veuillez accepter les conditions.'}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
