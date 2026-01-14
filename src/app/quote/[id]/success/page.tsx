'use client';

import { useEffect, useState } from 'react';
import {
    CheckCircle,
    CreditCard,
    ArrowRight,
    Loader2,
    Briefcase,
    Building2,
    Users
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function QuoteSuccessPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams(); // Needs import
    const quoteId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [clientId, setClientId] = useState<string | null>(null);
    const [sendingMandate, setSendingMandate] = useState(false);

    // Handle Popup Callback Mode
    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'popup_callback') {
            console.log('Popup callback mode detected. Signaling opener...');
            if (window.opener) {
                window.opener.postMessage({ type: 'QUOTE_SIGNED', quoteId }, '*');
                // Allow a brief moment for message to send before closing
                setTimeout(() => window.close(), 500);
            } else {
                // If no opener (e.g. direct visit), just behave normally or redirect
                router.replace(`/quote/${quoteId}/success`);
            }
            return;
        }
    }, [searchParams, quoteId, router]);

    // Fetch quote to get Client ID
    // Poll for Client ID (waiting for Webhook to finish creating client)
    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 20; // Try for 60 seconds
        let interval: NodeJS.Timeout;

        const checkClient = async () => {
            try {
                const response = await fetch(`/api/public/quotes/${quoteId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.client_id) {
                        setClientId(data.client_id);
                        setLoading(false);
                        return true; // Found
                    }
                }
            } catch (e) {
                console.error("Failed to fetch client ID", e);
            }
            return false;
        };

        // Check immediately
        checkClient().then(found => {
            if (!found) {
                setLoading(true); // Keep loading
                interval = setInterval(async () => {
                    attempts++;
                    console.log('Polling for client ID...', attempts);
                    const found = await checkClient();
                    if (found || attempts >= maxAttempts) {
                        clearInterval(interval);
                        if (!found) setLoading(false); // Stop loading even if failed
                    }
                }, 3000);
            }
        });

        return () => clearInterval(interval);
    }, [quoteId]);

    const handleSetupPayment = async () => {
        if (!clientId) return;
        setSendingMandate(true);
        try {
            const response = await fetch('/api/gocardless/create-mandate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: clientId,
                    redirect_uri: `${window.location.origin}/admin/clients/${clientId}`,
                    exit_uri: `${window.location.origin}/admin/clients/${clientId}`
                })
            });

            if (response.ok) {
                const { authorization_url } = await response.json();
                window.location.href = authorization_url;
            } else {
                alert("Erreur lors de l'initialisation du paiement.");
                setSendingMandate(false);
            }
        } catch (e) {
            console.error(e);
            alert("Une erreur est survenue.");
            setSendingMandate(false);
        }
    };

    const handleOpenProfile = () => {
        if (clientId) {
            router.push(`/admin/clients/${clientId}`);
        }
    };

    return (
        <section className="min-h-screen flex flex-col items-center justify-center py-20 bg-gray-50 px-6">
            <div className="bg-white p-10 rounded-3xl shadow-xl max-w-2xl w-full text-center">
                <div className="inline-flex p-6 rounded-full bg-green-100 mb-8 animate-in zoom-in duration-300">
                    <CheckCircle size={64} className="text-green-600" />
                </div>

                <h1 className="text-3xl font-bold mb-4 text-gray-900">Devis signé par le client !</h1>
                <p className="text-gray-600 text-lg mb-8">
                    Le devis <span className="font-semibold text-gray-900">{quoteId}</span> a été validé.
                    Le client est maintenant créé/actif.
                </p>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        {/* Option 1: SEPA */}
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                                    <CreditCard size={24} />
                                </div>
                                <h3 className="font-bold text-blue-900 text-lg mb-2">Configurer SEPA</h3>
                                <p className="text-blue-700 text-sm mb-6">
                                    Profiter de la présence du client pour configurer le prélèvement automatique maintenant.
                                </p>
                            </div>
                            <button
                                onClick={handleSetupPayment}
                                disabled={!clientId || sendingMandate}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {sendingMandate ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                                Configurer maintenant
                            </button>
                        </div>

                        {/* Option 2: Client Profile */}
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 mb-4">
                                    <Briefcase size={24} />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg mb-2">Ouvrir fiche client</h3>
                                <p className="text-gray-600 text-sm mb-6">
                                    Accéder au dashboard pour vérifier les infos, ajouter des notes ou gérer le projet.
                                </p>
                            </div>
                            <button
                                onClick={handleOpenProfile}
                                disabled={!clientId}
                                className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Users size={18} />
                                Voir le profil
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-400">
                    <button onClick={() => router.push('/admin/dashboard')} className="hover:text-gray-600 underline">
                        Retour au tableau de bord
                    </button>
                </div>
            </div>
        </section>
    );
}
