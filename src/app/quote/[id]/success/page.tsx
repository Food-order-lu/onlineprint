'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, CreditCard, ArrowRight, Loader2, Calendar } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function QuoteSuccessPage() {
    const params = useParams();
    const router = useRouter();
    const quoteId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [hasMandate, setHasMandate] = useState(false);

    useEffect(() => {
        // In a real app, we would fetch the client status here to check for mandate
        // For now we'll simulate a check or just assume false to show the CTA
        const checkStatus = async () => {
            await new Promise(r => setTimeout(r, 1000)); // Simulating network
            setLoading(false);
            // setHasMandate(false); // Default to false to show the payment setup
        };

        checkStatus();
    }, [quoteId]);

    const handleSetupPayment = async () => {
        // Redirect to GoCardless setup
        // Ideally this hits our API which creates a Billing Request and returns the url
        setLoading(true);
        try {
            const response = await fetch('/api/gocardless/create-mandate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteId,
                    // In real app we might need more info, but backend should lookup quote
                })
            });

            if (response.ok) {
                const { url } = await response.json();
                window.location.href = url;
            } else {
                alert("Erreur lors de l'initialisation du paiement.");
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            alert("Une erreur est survenue.");
            setLoading(false);
        }
    };

    return (
        <section className="min-h-screen flex flex-col items-center justify-center py-20 bg-gray-50 px-6">
            <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full text-center">
                <div className="inline-flex p-6 rounded-full bg-green-100 mb-8 animate-in zoom-in duration-300">
                    <CheckCircle size={64} className="text-green-600" />
                </div>

                <h1 className="text-3xl font-bold mb-4 text-gray-900">Devis signé avec succès !</h1>
                <p className="text-gray-600 text-lg mb-8">
                    Le devis <span className="font-semibold text-gray-900">{quoteId}</span> a bien été validé.
                    Une copie du contrat vous a été envoyée par email.
                </p>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-gray-400" size={32} />
                        </div>
                    ) : hasMandate ? (
                        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                            <h3 className="font-semibold text-green-800 mb-2 flex items-center justify-center gap-2">
                                <CreditCard size={20} />
                                Paiement configuré
                            </h3>
                            <p className="text-green-600 text-sm">
                                Votre mandat de prélèvement est actif. Aucune action n'est requise de votre part.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-left">
                            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <ArrowRight size={20} />
                                Prochaine étape
                            </h3>
                            <p className="text-blue-700 text-sm mb-6">
                                Pour finaliser l'activation de vos services, veuillez configurer le prélèvement automatique sécurisé (GoCardless).
                            </p>

                            <button
                                onClick={handleSetupPayment}
                                className="w-full btn bg-[#0D7377] text-white hover:bg-[#0A5F62] py-4 rounded-xl font-semibold shadow-lg shadow-teal-900/10 flex items-center justify-center gap-3 transition-transform active:scale-95"
                            >
                                <CreditCard size={20} />
                                Configurer le paiement
                            </button>
                            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-blue-400">
                                <span className="flex items-center gap-1"><CheckCircle size={10} /> Sécurisé</span>
                                <span className="flex items-center gap-1"><CheckCircle size={10} /> Sans frais</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-400">
                    Besoin d'aide ? <a href="mailto:support@rivego.lu" className="underline hover:text-gray-600">Contactez le support</a>
                </div>
            </div>
        </section>
    );
}
