// Admin Client Detail Page
// Path: /admin/clients/[id]

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Building2,
    Mail,
    Phone,
    MapPin,
    FileText,
    CreditCard,
    Euro,
    Plus,
    Trash2,
    Edit,
    AlertCircle,
    CheckCircle,
    XCircle,
    X,
    Clock,
    Calendar,
    Receipt,
    Ban,
    FileSignature,
    Loader2,
    Calculator
} from 'lucide-react';

// Types
type ClientStatus = 'active' | 'inactive' | 'pending_cancellation' | 'prospect' | 'pending_confirmation';
type ClientType = 'legacy' | 'new';
type ServiceType = 'hosting' | 'online_ordering' | 'table_reservation' | 'website' | 'maintenance' | 'other';
type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

interface Subscription {
    id: string;
    service_type: ServiceType;
    service_name: string | null;
    description: string | null;
    monthly_amount: number;
    commission_percent: number;
    status: SubscriptionStatus;
    started_at: string;
    cancelled_at: string | null;
}

interface Invoice {
    id: string;
    invoice_number: string;
    period_start: string | null;
    period_end: string | null;
    total: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    issued_at: string;
}

interface Mandate {
    id: string;
    mandate_id: string | null;
    status: 'pending' | 'active' | 'cancelled' | 'failed';
    iban_last4: string | null;
    bank_name: string | null;
    created_at: string;
}

interface Contract {
    id: string;
    document_url: string;
    status: 'draft' | 'sent' | 'signed' | 'expired' | 'terminated';
    signed_at: string | null;
    valid_from: string | null;
    valid_until: string | null;
}

interface Quote {
    id: string;
    quote_number: string;
    status: 'draft' | 'sent' | 'signed' | 'expired' | 'declined';
    total: number;
    signed_at: string | null;
    created_at: string;
}

interface OneTimeCharge {
    id: string;
    description: string;
    amount: number;
    invoiced: boolean;
    created_at: string;
}

interface Client {
    id: string;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country: string;
    vat_number: string | null;
    status: ClientStatus;
    client_type: ClientType;
    cancellation_requested_at: string | null;
    cancellation_effective_at: string | null;
    sepa_exception: boolean;
    sepa_exception_reason: string | null;
    notes: string | null;
    created_at: string;
    subscriptions: Subscription[];
    invoices: Invoice[];
    contracts: Contract[];
    quotes: Quote[];
    oneTimeCharges: OneTimeCharge[];
    mandate: Mandate | null;
    total_monthly: number;
}

const serviceTypeLabels: Record<ServiceType, string> = {
    hosting: 'Hébergement',
    online_ordering: 'Commandes en ligne',
    table_reservation: 'Réservation de table',
    website: 'Site Web',
    maintenance: 'Maintenance',
    other: 'Autre',
};

function StatusBadge({ status }: { status: ClientStatus }) {
    const config = {
        active: { icon: CheckCircle, label: 'Actif', className: 'bg-green-50 text-green-600 border-green-100' },
        inactive: { icon: XCircle, label: 'Inactif', className: 'bg-gray-50 text-gray-400 border-gray-200' },
        pending_cancellation: { icon: Clock, label: 'Résiliation en cours', className: 'bg-orange-50 text-orange-600 border-orange-100' },
        prospect: { icon: Calendar, label: 'Prospect', className: 'bg-blue-50 text-blue-600 border-blue-100' },
        pending_confirmation: { icon: AlertCircle, label: 'À confirmer', className: 'bg-amber-50 text-amber-600 border-amber-100' },
    };
    const { icon: Icon, label, className } = config[status] || config.active;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${className}`}>
            <Icon size={14} />
            {label}
        </span>
    );
}

function CancellationCountdown({ effectiveDate }: { effectiveDate: string | null }) {
    const [today, setToday] = useState(new Date());

    useEffect(() => {
        // Support Time Machine on Client Side
        const match = document.cookie.match(/(^| )NEXT_DEBUG_DATE=([^;]+)/);
        if (match && match[2]) {
            setToday(new Date(match[2]));
        }
    }, []);

    // No effective date set yet - show "Résiliation demandée"
    if (!effectiveDate) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                <Clock size={14} />
                Durée restante
            </span>
        );
    }

    const endDate = new Date(effectiveDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-red-100 text-red-700 border border-red-200">
                <AlertCircle size={14} />
                Résiliation effective
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-orange-100 text-orange-700 border border-orange-200">
            <Clock size={14} />
            J-{diffDays}
        </span>
    );
}

function Section({ title, icon: Icon, children, action }: {
    title: string;
    icon: any;
    children: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Icon size={20} className="text-blue-500" />
                    {title}
                </h3>
                {action}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dynamic states
    const [generatingContract, setGeneratingContract] = useState(false);
    const [sendingMandate, setSendingMandate] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [showAddSubscription, setShowAddSubscription] = useState(false);
    const [showAddCharge, setShowAddCharge] = useState(false);
    const [addingSubscription, setAddingSubscription] = useState(false);
    const [addingCharge, setAddingCharge] = useState(false);
    const [generatingInvoice, setGeneratingInvoice] = useState(false);
    const [showManualMandate, setShowManualMandate] = useState(false);
    const [addingMandate, setAddingMandate] = useState(false);
    const [manualIban, setManualIban] = useState('');

    // Cancellation Modal State
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showInvoiceConfirmModal, setShowInvoiceConfirmModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelType, setCancelType] = useState('full');

    // Inline Edit State for Subscriptions
    const [editingSubId, setEditingSubId] = useState<string | null>(null);
    const [editDate, setEditDate] = useState('');

    // Contract Edit State
    const [isEditingContract, setIsEditingContract] = useState(false);
    const [contractDuration, setContractDuration] = useState('12');
    const [contractRenewal, setContractRenewal] = useState('Tacite');

    // Form states
    const [newSubscription, setNewSubscription] = useState({
        service_type: 'hosting' as ServiceType,
        service_name: '',
        monthly_amount: '',
        commission_percent: '0',
        started_at: new Date().toISOString().split('T')[0],
    });
    const [newCharge, setNewCharge] = useState({ description: '', amount: '' });

    const fetchClient = async () => {
        try {
            const response = await fetch(`/api/clients/${resolvedParams.id}`);
            if (!response.ok) throw new Error('Client not found');
            const data = await response.json();
            setClient(data.client);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClient();
    }, [resolvedParams.id]);

    const handleSendMandateRequest = async () => {
        if (!confirm('Voulez-vous envoyer un email de demande de mandat SEPA à ce client ?')) return;

        setSendingMandate(true);
        try {
            const response = await fetch('/api/gocardless/create-mandate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: resolvedParams.id,
                    redirect_uri: `${window.location.origin}/admin/clients/${resolvedParams.id}?mandate=success`,
                    exit_uri: `${window.location.origin}/admin/clients/${resolvedParams.id}?mandate=cancelled`,
                    send_email: true // Trigger Resend email
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create mandate');
            }

            const data = await response.json();

            if (data.email_sent) {
                alert(`Email envoyé avec succès à ${client?.email} !`);
            } else {
                // Fallback if email failed (e.g. key missing)
                alert(`Lien généré (Email non envoyé): \n${data.authorization_url}`);
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erreur');
        } finally {
            setSendingMandate(false);
        }
    };

    const handleManualMandate = async () => {
        if (!manualIban) return;
        setAddingMandate(true);
        try {
            const response = await fetch(`/api/clients/${resolvedParams.id}/mandate/manual`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ iban: manualIban })
            });

            if (!response.ok) throw new Error('Failed to create mandate');

            await fetchClient();
            setShowManualMandate(false);
            setManualIban('');
            alert('Mandat ajouté avec succès !');
        } catch (err) {
            alert('Erreur lors de l\'ajout du mandat');
        } finally {
            setAddingMandate(false);
        }
    };

    const handleGenerateContract = async () => {
        setGeneratingContract(true);
        try {
            const response = await fetch(`/api/clients/${resolvedParams.id}/generate-contract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (!response.ok) throw new Error('Failed to generate contract');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Contrat-${client?.company_name}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            alert('Erreur lors de la génération du contrat');
        } finally {
            setGeneratingContract(false);
        }
    };

    const handleInitiateCancellation = () => {
        setCancelReason('');
        setCancelType('full');
        setShowCancelModal(true);
    };

    const confirmCancellation = async () => {
        if (!cancelReason) return alert('Veuillez indiquer un motif.');

        setCancelling(true);
        try {
            const response = await fetch(`/api/clients/${resolvedParams.id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: cancelReason, type: cancelType })
            });

            if (!response.ok) throw new Error('Failed');

            await fetchClient();
            setShowCancelModal(false);
            alert('Résiliation initiée avec succès.');
        } catch (e) {
            alert('Erreur lors de la résiliation.');
        } finally {
            setCancelling(false);
        }
    };

    const handleAddSubscription = async () => {
        setAddingSubscription(true);
        try {
            const response = await fetch('/api/subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newSubscription,
                    monthly_amount: parseFloat(newSubscription.monthly_amount),
                    commission_percent: parseFloat(newSubscription.commission_percent),
                    started_at: newSubscription.started_at,
                }),
            });
            if (response.ok) {
                await fetchClient();
                setShowAddSubscription(false);
            }
        } catch (e) {
            alert('Erreur');
        } finally {
            setAddingSubscription(false);
        }
    };

    const handleAddCharge = async () => {
        setAddingCharge(true);
        try {
            const response = await fetch('/api/one-time-charges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: resolvedParams.id,
                    ...newCharge,
                    amount: parseFloat(newCharge.amount),
                }),
            });
            if (response.ok) {
                await fetchClient();
                setShowAddCharge(false);
            }
        } catch (e) {
            alert('Erreur');
        } finally {
            setAddingCharge(false);
        }
    };

    const handleGenerateInvoice = () => {
        setShowInvoiceConfirmModal(true);
    };

    const confirmGenerateInvoice = async () => {
        setShowInvoiceConfirmModal(false);
        setGeneratingInvoice(true);
        try {
            const response = await fetch(`/api/clients/${resolvedParams.id}/generate-invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erreur lors de la génération');
            }

            const data = await response.json();
            alert(`Facture ${data.zoho_number} générée avec succès !`);
            await fetchClient();
        } catch (e: any) {
            alert(e.message || 'Erreur');
        } finally {
            setGeneratingInvoice(false);
        }
    };

    if (loading) return <div className="p-12 text-center">Chargement...</div>;
    if (error || !client) return <div className="p-12 text-center text-red-500">{error || 'Client non trouvé'}</div>;

    return (
        <div className="min-h-screen bg-white pb-20">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <Link href="/admin/clients" className="inline-flex items-center gap-2 text-gray-500 mb-8 hover:text-blue-600 transition-colors">
                    <ArrowLeft size={18} /> Retour
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl">
                            <Building2 size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{client.company_name}</h1>
                            <p className="text-gray-500 font-medium">{client.contact_name}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status={client.status} />
                        {client.status === 'pending_cancellation' && (
                            <CancellationCountdown effectiveDate={client.cancellation_effective_at} />
                        )}

                        <Link
                            href={`/admin/clients/${client.id}/edit`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                            <Edit size={18} />
                        </Link>

                        <button
                            onClick={handleGenerateContract}
                            disabled={generatingContract}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            {generatingContract ? <Loader2 size={18} className="animate-spin" /> : <FileSignature size={18} />}
                            <span className="hidden sm:inline">Contrat</span>
                        </button>

                        {(client.status === 'active' || client.status === 'pending_confirmation') && (
                            <button
                                onClick={handleInitiateCancellation}
                                disabled={cancelling}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                                {cancelling ? <Loader2 size={18} className="animate-spin" /> : <Ban size={18} />}
                                <span className="hidden sm:inline">Résilier</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Section title="Contact" icon={Mail}>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Mail size={18} className="text-gray-300" />
                                    <span className="text-gray-600">{client.email}</span>
                                </div>
                                {client.phone && (
                                    <div className="flex items-center gap-3">
                                        <Phone size={18} className="text-gray-300" />
                                        <span className="text-gray-600">{client.phone}</span>
                                    </div>
                                )}
                                {client.address && (
                                    <div className="flex items-start gap-3">
                                        <MapPin size={18} className="text-gray-300 mt-1" />
                                        <span className="text-gray-600">
                                            {client.address}<br />
                                            {client.postal_code} {client.city}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Section>

                        <Section title="Mandat SEPA" icon={CreditCard}>
                            {client.mandate ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-100">
                                        <span className="text-green-700 font-semibold text-sm">ACTIF</span>
                                        <CheckCircle size={18} className="text-green-600" />
                                    </div>
                                    <p className="text-sm text-gray-500">IBAN: **** {client.mandate.iban_last4}</p>
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-sm text-gray-400 mb-4">Aucun mandat</p>
                                    <button
                                        onClick={handleSendMandateRequest}
                                        disabled={sendingMandate}
                                        className="w-full py-2.5 bg-white border border-gray-200 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors disabled:opacity-50"
                                    >
                                        {sendingMandate ? 'Envoi...' : 'Envoyer Demande SEPA'}
                                    </button>

                                    <button
                                        onClick={() => setShowManualMandate(!showManualMandate)}
                                        className="w-full mt-2 py-2 text-xs text-gray-500 hover:text-gray-700 underline"
                                    >
                                        Ajouter manuellement
                                    </button>

                                    {showManualMandate && (
                                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                                            <input
                                                type="text"
                                                placeholder="IBAN (LU73...)"
                                                value={manualIban}
                                                onChange={e => setManualIban(e.target.value)}
                                                className="w-full p-2 text-sm border rounded-lg mb-2 uppercase"
                                            />
                                            <button
                                                onClick={handleManualMandate}
                                                disabled={addingMandate || !manualIban}
                                                className="w-full py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                                            >
                                                {addingMandate ? 'Ajout...' : 'Valider'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Section>

                        <Section title="Contrat & Engagement" icon={FileText}>
                            <div className="space-y-4">
                                {isEditingContract ? (
                                    <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Durée d'engagement (Mois)</label>
                                            <select
                                                value={contractDuration}
                                                onChange={(e) => setContractDuration(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                                            >
                                                <option value="12">12 Mois</option>
                                                <option value="24">24 Mois</option>
                                                <option value="36">36 Mois</option>
                                                <option value="48">48 Mois</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Type de Renouvellement</label>
                                            <select
                                                value={contractRenewal}
                                                onChange={(e) => setContractRenewal(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                                            >
                                                <option value="Tacite">Tacite Reconduction</option>
                                                <option value="Manuel">Manuel</option>
                                            </select>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => setIsEditingContract(false)}
                                                className="flex-1 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                onClick={() => {
                                                    // Placeholder save logic
                                                    alert("Termes mis à jour (Simulation)");
                                                    setIsEditingContract(false);
                                                }}
                                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm"
                                            >
                                                Enregistrer
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 text-sm">Durée d'engagement</span>
                                            <span className="font-semibold text-gray-900">{contractDuration} Mois</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 text-sm">Fin d'engagement</span>
                                            <span className="font-semibold text-gray-900">
                                                {client.created_at ? new Date(new Date(client.created_at).setFullYear(new Date(client.created_at).getFullYear() + parseInt(contractDuration))).toLocaleDateString('fr-FR') : '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 text-sm">Renouvellement</span>
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-semibold">{contractRenewal}</span>
                                        </div>

                                        <button
                                            onClick={() => setIsEditingContract(true)}
                                            className="w-full mt-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                                        >
                                            <Edit size={14} />
                                            Modifier les termes
                                        </button>
                                    </>
                                )}
                            </div>
                        </Section>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Subscriptions */}
                        <Section
                            title="Abonnements Mensuels"
                            icon={Euro}
                            action={
                                <button onClick={() => setShowAddSubscription(!showAddSubscription)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                    <Plus size={20} />
                                </button>
                            }
                        >
                            <div className="space-y-4">
                                {showAddSubscription && (
                                    <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
                                        <h4 className="font-semibold text-blue-900 mb-3">Nouvel abonnement</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <select
                                                value={newSubscription.service_type}
                                                onChange={e => setNewSubscription({ ...newSubscription, service_type: e.target.value as ServiceType })}
                                                className="p-2 border rounded-lg"
                                            >
                                                {Object.entries(serviceTypeLabels).map(([key, label]) => (
                                                    <option key={key} value={key}>{label}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Nom du service (optionnel)"
                                                value={newSubscription.service_name}
                                                onChange={e => setNewSubscription({ ...newSubscription, service_name: e.target.value })}
                                                className="p-2 border rounded-lg"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Montant mensuel (€)"
                                                value={newSubscription.monthly_amount}
                                                onChange={e => setNewSubscription({ ...newSubscription, monthly_amount: e.target.value })}
                                                className="p-2 border rounded-lg"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Commission (%)"
                                                value={newSubscription.commission_percent}
                                                onChange={e => setNewSubscription({ ...newSubscription, commission_percent: e.target.value })}
                                                className="p-2 border rounded-lg"
                                            />
                                            <div className="flex flex-col">
                                                <label className="text-xs text-gray-500 mb-1">Date de début</label>
                                                <input
                                                    type="date"
                                                    value={newSubscription.started_at}
                                                    onChange={e => setNewSubscription({ ...newSubscription, started_at: e.target.value })}
                                                    className="p-2 border rounded-lg"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setShowAddSubscription(false)}
                                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                onClick={handleAddSubscription}
                                                disabled={addingSubscription}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {addingSubscription ? 'Ajout...' : 'Ajouter'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {client.subscriptions.length === 0 ? (
                                    <p className="text-center text-gray-400 py-8 italic">Aucun abonnement actif</p>
                                ) : client.subscriptions.map(sub => (
                                    <div key={sub.id} className="flex justify-between items-center p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900">{sub.service_name || serviceTypeLabels[sub.service_type]}</p>
                                            <p className="text-sm text-gray-400">{serviceTypeLabels[sub.service_type]}</p>

                                            {editingSubId === sub.id ? (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <input
                                                        type="date"
                                                        value={editDate}
                                                        onChange={(e) => setEditDate(e.target.value)}
                                                        className="p-1 border rounded text-sm"
                                                    />
                                                    <button
                                                        onClick={async () => {
                                                            if (!editDate) return;
                                                            try {
                                                                await fetch(`/api/subscriptions/${sub.id}`, {
                                                                    method: 'PATCH',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ started_at: editDate })
                                                                });
                                                                // Use router refresh or fetchClient instead of reload for smoother UX
                                                                await fetchClient();
                                                                setEditingSubId(null);
                                                            } catch (err) {
                                                                alert('Erreur lors de la modification');
                                                            }
                                                        }}
                                                        className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                                    >
                                                        <CheckCircle size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingSubId(null)}
                                                        className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 group">
                                                    Début : {sub.started_at ? new Date(sub.started_at).toLocaleDateString('fr-FR') : 'Non défini'}
                                                    <button
                                                        onClick={() => {
                                                            setEditingSubId(sub.id);
                                                            setEditDate(sub.started_at || new Date().toISOString().split('T')[0]);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 transition-opacity"
                                                        title="Modifier la date"
                                                    >
                                                        <Edit size={12} />
                                                    </button>
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-xl font-black text-gray-900">{sub.monthly_amount.toFixed(2)}€<span className="text-xs text-gray-400">/mois</span></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* One Time Charges */}
                        <Section
                            title="Frais Uniques / Services"
                            icon={Receipt}
                            action={
                                <button onClick={() => setShowAddCharge(!showAddCharge)} className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
                                    <Plus size={20} />
                                </button>
                            }
                        >
                            <div className="space-y-4">
                                {showAddCharge && (
                                    <div className="bg-purple-50 p-4 rounded-xl mb-4 border border-purple-100">
                                        <h4 className="font-semibold text-purple-900 mb-3">Nouveau frais unique</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <input
                                                type="text"
                                                placeholder="Description"
                                                value={newCharge.description}
                                                onChange={e => setNewCharge({ ...newCharge, description: e.target.value })}
                                                className="p-2 border rounded-lg col-span-2"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Montant (€)"
                                                value={newCharge.amount}
                                                onChange={e => setNewCharge({ ...newCharge, amount: e.target.value })}
                                                className="p-2 border rounded-lg"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setShowAddCharge(false)}
                                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                onClick={handleAddCharge}
                                                disabled={addingCharge}
                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                            >
                                                {addingCharge ? 'Ajout...' : 'Ajouter'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {client.oneTimeCharges?.length === 0 ? (
                                    <p className="text-center text-gray-400 py-4 italic">Aucun frais unique</p>
                                ) : client.oneTimeCharges?.map(charge => (
                                    <div key={charge.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="font-semibold text-gray-900">{charge.description}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${charge.invoiced ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {charge.invoiced ? 'Facturé' : 'En attente'}
                                            </span>
                                        </div>
                                        <p className="font-bold text-gray-900">{charge.amount.toFixed(2)}€</p>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* Next Invoice Estimation */}
                        <Section
                            title="Estimation Prochaine Facture"
                            icon={Calculator}
                            action={
                                <button
                                    onClick={handleGenerateInvoice}
                                    disabled={generatingInvoice || (client.total_monthly === 0 && (!client.oneTimeCharges?.some(c => !c.invoiced)))}
                                    className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-bold rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {generatingInvoice ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
                                    Facturer Maintenant
                                </button>
                            }
                        >
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Abonnements (Mois prochain)</span>
                                    <span className="font-medium">{client.total_monthly.toFixed(2)}€</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Frais uniques</span>
                                    <span className="font-medium">
                                        {(client.oneTimeCharges?.filter(c => !c.invoiced).reduce((sum, c) => sum + c.amount, 0) || 0).toFixed(2)}€
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                    <span className="font-semibold text-gray-900">Total Estimé</span>
                                    <span className="text-xl font-bold text-blue-600">
                                        {(client.total_monthly + (client.oneTimeCharges?.filter(c => !c.invoiced).reduce((sum, c) => sum + c.amount, 0) || 0)).toFixed(2)}€
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    * Estimation pour le début du mois prochain (Abonnements + Frais en attente).
                                </p>
                            </div>
                        </Section>

                        {/* Recent Invoices */}
                        <Section title="Factures Récentes" icon={Receipt}>
                            <div className="space-y-3">
                                {client.invoices.length === 0 ? (
                                    <p className="text-center text-gray-400 py-4 italic">Aucune facture</p>
                                ) : client.invoices.slice(0, 5).map(inv => (
                                    <div key={inv.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="font-semibold text-gray-900">{inv.invoice_number}</p>
                                            <p className="text-xs text-gray-400">{new Date(inv.issued_at).toLocaleDateString()}</p>
                                        </div>
                                        <p className="font-bold text-gray-900">{inv.total.toFixed(2)}€</p>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* Devis (Quotes) */}
                        <Section title="Devis" icon={FileText}>
                            <div className="space-y-3">
                                {client.quotes.length === 0 ? (
                                    <p className="text-center text-gray-400 py-4 italic">Aucun devis</p>
                                ) : client.quotes.map(quote => (
                                    <div key={quote.id} className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <div>
                                            <p className="font-semibold text-gray-900">{quote.quote_number}</p>
                                            <p className="text-xs text-gray-400">{new Date(quote.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${quote.status === 'signed' ? 'bg-green-100 text-green-700' :
                                                quote.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {quote.status === 'signed' ? 'Signé' : quote.status === 'sent' ? 'Envoyé' : 'Brouillon'}
                                            </span>
                                            <p className="font-bold text-gray-900">{quote.total.toFixed(2)}€</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* Contrats */}
                        <Section title="Contrats" icon={FileSignature}>
                            <div className="space-y-3">
                                {client.contracts.length === 0 ? (
                                    <p className="text-center text-gray-400 py-4 italic">Aucun contrat</p>
                                ) : client.contracts.map(contract => (
                                    <div key={contract.id} className="flex justify-between items-center p-4 bg-purple-50 rounded-xl border border-purple-100">
                                        <div>
                                            <p className="font-semibold text-gray-900">Contrat</p>
                                            <p className="text-xs text-gray-400">
                                                {contract.valid_from ? `Du ${new Date(contract.valid_from).toLocaleDateString()}` : 'Date non définie'}
                                                {contract.valid_until ? ` au ${new Date(contract.valid_until).toLocaleDateString()}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${contract.status === 'signed' ? 'bg-green-100 text-green-700' :
                                                contract.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                                    contract.status === 'terminated' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {contract.status === 'signed' ? 'Signé' :
                                                    contract.status === 'sent' ? 'Envoyé' :
                                                        contract.status === 'terminated' ? 'Résilié' : 'Brouillon'}
                                            </span>
                                            {contract.document_url && (
                                                <a href={contract.document_url} target="_blank" rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-sm">
                                                    Voir
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </div>
                </div>
            </div>
            {/* Cancellation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <AlertCircle className="text-red-500" />
                                Résilier le contrat
                            </h3>
                            <button onClick={() => setShowCancelModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type de résiliation</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setCancelType('full')}
                                        className={`p-3 rounded-xl border text-sm font-medium transition-colors ${cancelType === 'full'
                                            ? 'bg-red-50 border-red-200 text-red-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        Totale / Complète
                                    </button>
                                    <button
                                        onClick={() => setCancelType('service')}
                                        className={`p-3 rounded-xl border text-sm font-medium transition-colors ${cancelType === 'service'
                                            ? 'bg-orange-50 border-orange-200 text-orange-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        Service partiel
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motif de la résiliation</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)}
                                    placeholder="Raison du départ, services concernés..."
                                    className="w-full p-3 border border-gray-200 rounded-xl min-h-[100px] focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                            </div>

                            <div className="bg-yellow-50 p-3 rounded-lg flex gap-2 items-start text-xs text-yellow-800">
                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                <p>La résiliation sera effective après la période de préavis contractuelle (2 mois).</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmCancellation}
                                disabled={cancelling || !cancelReason}
                                className="px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {cancelling ? <Loader2 size={18} className="animate-spin" /> : <Ban size={18} />}
                                Confirmer la résiliation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Confirmation Modal */}
            {showInvoiceConfirmModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Générer une facture</h3>
                            <p className="text-gray-500 mb-6">
                                Voulez-vous générer une facture pour les abonnements et frais en attente ?<br />
                                <span className="text-xs text-orange-600 font-medium">Note: Cela marquera les frais comme facturés.</span>
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowInvoiceConfirmModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmGenerateInvoice}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                                >
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
