// Cancellation Confirmation Page
// Path: /cancel/[token]

'use client';

import { useState, useEffect, useRef, use } from 'react';
import SignaturePad from 'signature_pad';
import {
    AlertTriangle,
    CheckCircle,
    FileSignature,
    Calendar,
    Building2,
    Loader2,
    XCircle
} from 'lucide-react';

interface CancellationData {
    id: string;
    client: {
        company_name: string;
        contact_name: string;
        email: string;
    };
    cancel_type: 'full' | 'service';
    subscription?: {
        service_name: string;
        monthly_amount: number;
    };
    requested_at: string;
    effective_at: string; // 2 months after signature
    already_signed: boolean;
}

export default function CancellationPage({ params }: { params: Promise<{ token: string }> }) {
    const resolvedParams = use(params);
    const [cancellation, setCancellation] = useState<CancellationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const signaturePadRef = useRef<SignaturePad | null>(null);

    // Fetch cancellation data
    useEffect(() => {
        async function fetchCancellation() {
            // Mock data for demo
            if (resolvedParams.token === 'demo') {
                setCancellation({
                    id: 'demo-123',
                    client: {
                        company_name: 'Restaurant La Bella Vita',
                        contact_name: 'Marco Rossi',
                        email: 'marco@labellavita.lu'
                    },
                    cancel_type: 'full',
                    requested_at: new Date().toISOString(),
                    effective_at: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString(),
                    already_signed: false
                });
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/cancel/${resolvedParams.token}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Lien de résiliation invalide ou expiré.');
                    }
                    throw new Error('Erreur lors du chargement.');
                }
                const data = await response.json();
                setCancellation(data.cancellation);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur inconnue');
            } finally {
                setLoading(false);
            }
        }
        fetchCancellation();
    }, [resolvedParams.token]);

    // Initialize signature pad
    useEffect(() => {
        if (canvasRef.current && !cancellation?.already_signed) {
            signaturePadRef.current = new SignaturePad(canvasRef.current, {
                backgroundColor: 'rgb(255, 255, 255)',
                penColor: 'rgb(0, 0, 0)',
            });

            // Resize canvas
            const resizeCanvas = () => {
                const canvas = canvasRef.current!;
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                canvas.getContext('2d')!.scale(ratio, ratio);
                signaturePadRef.current?.clear();
            };

            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            return () => window.removeEventListener('resize', resizeCanvas);
        }
    }, [cancellation]);

    // Clear signature
    const handleClear = () => {
        signaturePadRef.current?.clear();
    };

    // Submit cancellation
    const handleSubmit = async () => {
        if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
            alert('Veuillez signer avant de confirmer.');
            return;
        }

        setSubmitting(true);
        try {
            const signatureData = signaturePadRef.current.toDataURL();

            const response = await fetch(`/api/cancel/${resolvedParams.token}/sign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signature: signatureData }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la signature.');
            }

            setSuccess(true);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-blue-400 mx-auto mb-4" />
                    <p className="text-gray-400">Chargement...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !cancellation) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-red-500/20 p-8 text-center">
                    <XCircle size={64} className="text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Lien invalide</h1>
                    <p className="text-gray-400">{error || 'Ce lien de résiliation est invalide ou a expiré.'}</p>
                </div>
            </div>
        );
    }

    // Already signed
    if (cancellation.already_signed) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-green-500/20 p-8 text-center">
                    <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Résiliation confirmée</h1>
                    <p className="text-gray-400 mb-4">
                        Votre demande de résiliation a déjà été signée et confirmée.
                    </p>
                    <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-sm text-gray-400">Date effective de résiliation :</p>
                        <p className="text-lg font-semibold text-white">
                            {new Date(cancellation.effective_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Success state after signing
    if (success) {
        // Calculate effective date (2 months from now)
        const effectiveDate = new Date();
        effectiveDate.setMonth(effectiveDate.getMonth() + 2);

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-green-500/20 p-8 text-center">
                    <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Résiliation confirmée</h1>
                    <p className="text-gray-400 mb-6">
                        Votre demande de résiliation a été enregistrée avec succès.
                    </p>

                    <div className="bg-white/5 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-400 mb-1">Date effective de résiliation :</p>
                        <p className="text-xl font-bold text-white">
                            {effectiveDate.toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>

                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-left">
                        <p className="text-sm text-orange-400">
                            <strong>Important :</strong> Conformément aux conditions générales,
                            les prélèvements continueront pendant les 2 prochains mois jusqu&apos;à
                            la date effective de résiliation.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-4">
                        <AlertTriangle size={32} className="text-orange-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Confirmation de résiliation</h1>
                    <p className="text-gray-400">
                        Veuillez lire attentivement les informations ci-dessous avant de confirmer.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                    {/* Client info */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Building2 size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-white">{cancellation.client.company_name}</p>
                                <p className="text-sm text-gray-400">{cancellation.client.contact_name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Cancellation details */}
                    <div className="p-6 border-b border-white/10">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <FileSignature size={18} className="text-blue-400" />
                            Détails de la résiliation
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Type de résiliation</span>
                                <span className="text-white font-medium">
                                    {cancellation.cancel_type === 'full'
                                        ? 'Résiliation totale du contrat'
                                        : `Service: ${cancellation.subscription?.service_name}`
                                    }
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Date de la demande</span>
                                <span className="text-white">
                                    {new Date(cancellation.requested_at).toLocaleDateString('fr-FR')}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Date effective</span>
                                <span className="text-white font-semibold flex items-center gap-2">
                                    <Calendar size={16} className="text-blue-400" />
                                    {new Date(cancellation.effective_at).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="p-6 bg-orange-500/5 border-b border-white/10">
                        <div className="flex gap-4">
                            <AlertTriangle size={24} className="text-orange-400 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-orange-400 mb-1">Important</p>
                                <p className="text-sm text-gray-300">
                                    Conformément aux conditions générales de vente, la résiliation prendra effet
                                    <strong className="text-white"> 2 mois après la signature</strong>.
                                    Les prélèvements mensuels continueront jusqu&apos;à cette date.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Signature */}
                    <div className="p-6">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <FileSignature size={18} className="text-blue-400" />
                            Signature électronique
                        </h3>

                        <p className="text-sm text-gray-400 mb-4">
                            En signant ci-dessous, je confirme avoir lu et accepté les conditions de résiliation.
                        </p>

                        <div className="relative mb-4">
                            <canvas
                                ref={canvasRef}
                                className="w-full h-40 bg-white rounded-lg border-2 border-dashed border-gray-300 cursor-crosshair"
                            />
                            <button
                                onClick={handleClear}
                                className="absolute top-2 right-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
                            >
                                Effacer
                            </button>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => window.history.back()}
                                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-medium transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Signature en cours...
                                    </>
                                ) : (
                                    <>
                                        <FileSignature size={20} />
                                        Confirmer la résiliation
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    En cas de questions, contactez-nous à support@rivego.lu
                </p>
            </div>
        </div>
    );
}
