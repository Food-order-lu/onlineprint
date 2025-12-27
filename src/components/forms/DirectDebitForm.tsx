// Direct Debit Form Component
// Popup after quote signature for new clients with recurring services

'use client';

import { useState } from 'react';
import {
    CreditCard,
    Shield,
    CheckCircle,
    AlertCircle,
    Loader2,
    ExternalLink,
    X
} from 'lucide-react';

interface DirectDebitFormProps {
    clientId: string;
    clientName: string;
    monthlyAmount: number;
    onComplete: () => void;
    onSkip?: () => void; // Only for legacy clients or exceptions
    isException?: boolean; // If true, allow skipping
}

export default function DirectDebitForm({
    clientId,
    clientName,
    monthlyAmount,
    onComplete,
    onSkip,
    isException = false,
}: DirectDebitFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSkipConfirm, setShowSkipConfirm] = useState(false);

    // Start GoCardless mandate flow
    const handleSetupMandate = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/gocardless/create-mandate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: clientId,
                    redirect_uri: `${window.location.origin}/client/mandate-success?onboarding=true`,
                    exit_uri: `${window.location.origin}/client/mandate-cancelled`,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create mandate');
            }

            const { authorization_url } = await response.json();

            // Redirect to GoCardless hosted page
            window.location.href = authorization_url;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
            setLoading(false);
        }
    };

    // Handle skip (only for exceptions)
    const handleSkip = () => {
        if (onSkip) {
            onSkip();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-white/10 max-w-lg w-full overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <CreditCard size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Configuration du prélèvement</h2>
                            <p className="text-gray-400 text-sm">Prélèvement SEPA automatique</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Info card */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Shield size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-blue-400 font-medium mb-1">Paiement sécurisé</p>
                                <p className="text-sm text-gray-300">
                                    Le prélèvement SEPA est un moyen de paiement sécurisé et protégé par la réglementation européenne.
                                    Vous gardez le contrôle et pouvez contester tout prélèvement non autorisé.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-white/5 rounded-xl p-4 mb-6">
                        <p className="text-gray-400 text-sm mb-2">Client</p>
                        <p className="text-white font-medium mb-4">{clientName}</p>

                        <p className="text-gray-400 text-sm mb-2">Montant mensuel</p>
                        <p className="text-2xl font-bold text-white">
                            €{monthlyAmount.toFixed(2)}
                            <span className="text-sm font-normal text-gray-400">/mois</span>
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-sm">
                            <CheckCircle size={18} className="text-green-400" />
                            <span className="text-gray-300">Prélèvement automatique entre le 5 et le 10 du mois</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <CheckCircle size={18} className="text-green-400" />
                            <span className="text-gray-300">Pas besoin de payer manuellement chaque mois</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <CheckCircle size={18} className="text-green-400" />
                            <span className="text-gray-300">Annulation possible à tout moment</span>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 flex items-center gap-3">
                            <AlertCircle size={18} className="text-red-400" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={handleSetupMandate}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Redirection vers GoCardless...
                                </>
                            ) : (
                                <>
                                    <ExternalLink size={20} />
                                    Configurer le prélèvement SEPA
                                </>
                            )}
                        </button>

                        {isException && (
                            <>
                                {!showSkipConfirm ? (
                                    <button
                                        onClick={() => setShowSkipConfirm(true)}
                                        className="w-full px-6 py-3 text-gray-400 hover:text-white transition-colors text-sm"
                                    >
                                        Ignorer cette étape (exception)
                                    </button>
                                ) : (
                                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                                        <p className="text-sm text-orange-400 mb-3">
                                            <strong>Attention :</strong> Sans prélèvement automatique,
                                            vous devrez payer manuellement chaque mois.
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowSkipConfirm(false)}
                                                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                onClick={handleSkip}
                                                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm transition-colors"
                                            >
                                                Confirmer l&apos;exception
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 bg-white/5">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <Shield size={14} />
                        <span>Paiement sécurisé par GoCardless • Conforme SEPA</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// MANDATE SUCCESS PAGE COMPONENT
// =============================================================================

export function MandateSuccessContent({ isOnboarding = false }: { isOnboarding?: boolean }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-green-500/20 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} className="text-green-400" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Mandat SEPA configuré</h1>
                <p className="text-gray-400 mb-6">
                    Votre prélèvement automatique a été configuré avec succès.
                </p>

                <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                            <CheckCircle size={16} className="text-green-400" />
                            <span className="text-gray-300">Mandat SEPA actif</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle size={16} className="text-green-400" />
                            <span className="text-gray-300">Prélèvement automatique activé</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle size={16} className="text-green-400" />
                            <span className="text-gray-300">Prochain prélèvement : entre le 5 et le 10</span>
                        </div>
                    </div>
                </div>

                {isOnboarding ? (
                    <a
                        href="/client"
                        className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                    >
                        Accéder à mon espace client
                    </a>
                ) : (
                    <a
                        href="/client"
                        className="text-blue-400 hover:underline"
                    >
                        Retour à l&apos;espace client
                    </a>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// MANDATE CANCELLED PAGE COMPONENT
// =============================================================================

export function MandateCancelledContent() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-orange-500/20 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-6">
                    <X size={32} className="text-orange-400" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Configuration annulée</h1>
                <p className="text-gray-400 mb-6">
                    La configuration du prélèvement automatique a été annulée.
                </p>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm text-orange-400">
                        <strong>Important :</strong> Sans prélèvement automatique, vous devrez payer manuellement chaque mois pour maintenir vos services actifs.
                    </p>
                </div>

                <div className="space-y-3">
                    <a
                        href="/client/setup-mandate"
                        className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                    >
                        Réessayer la configuration
                    </a>
                    <a
                        href="/client"
                        className="block text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        Continuer sans prélèvement
                    </a>
                </div>
            </div>
        </div>
    );
}
