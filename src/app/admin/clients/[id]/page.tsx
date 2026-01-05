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
    Clock,
    Calendar,
    Receipt,
    Ban,
    FileSignature,
    Loader2
} from 'lucide-react';

// Types
type ClientStatus = 'active' | 'inactive' | 'pending_cancellation';
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

// Service type labels
const serviceTypeLabels: Record<ServiceType, string> = {
    hosting: 'Hébergement',
    online_ordering: 'Commandes en ligne',
    table_reservation: 'Réservation de table',
    website: 'Site Web',
    maintenance: 'Maintenance',
    other: 'Autre',
};

// Status badge
function StatusBadge({ status }: { status: ClientStatus }) {
    const config = {
        active: { icon: CheckCircle, label: 'Actif', className: 'bg-green-50 text-green-600 border-green-100' },
        inactive: { icon: XCircle, label: 'Inactif', className: 'bg-gray-50 text-gray-400 border-gray-200' },
        pending_cancellation: { icon: Clock, label: 'Résiliation en cours', className: 'bg-orange-50 text-orange-600 border-orange-100' },
    };
    const { icon: Icon, label, className } = config[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${className}`}>
            <Icon size={14} />
            {label}
        </span>
    );
}

// Subscription status badge
function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
    const config = {
        active: { label: 'Actif', className: 'bg-green-50 text-green-600 border-green-100' },
        paused: { label: 'Pausé', className: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
        cancelled: { label: 'Annulé', className: 'bg-red-50 text-red-600 border-red-100' },
    };
    const { label, className } = config[status];
    return <span className={`px-2 py-0.5 border rounded text-xs font-semibold ${className}`}>{label}</span>;
}

// Invoice status badge
function InvoiceBadge({ status }: { status: Invoice['status'] }) {
    const config = {
        draft: { label: 'Brouillon', className: 'bg-gray-50 text-gray-600 border-gray-200' },
        sent: { label: 'Envoyée', className: 'bg-blue-50 text-blue-600 border-blue-100' },
        paid: { label: 'Payée', className: 'bg-green-50 text-green-600 border-green-100' },
        overdue: { label: 'En retard', className: 'bg-red-50 text-red-600 border-red-100' },
        cancelled: { label: 'Annulée', className: 'bg-gray-50 text-gray-400 border-gray-200' },
    };
    const { label, className } = config[status];
    return <span className={`px-2 py-0.5 border rounded text-xs font-semibold ${className}`}>{label}</span>;
}

// Section component
function Section({ title, icon: Icon, children, action }: {
    title: string;
    icon: typeof Building2;
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
    const [cancelling, setCancelling] = useState(false);

    // Modal states
    const [showAddSubscription, setShowAddSubscription] = useState(false);
    const [showAddCharge, setShowAddCharge] = useState(false);
    const [addingSubscription, setAddingSubscription] = useState(false);
    const [addingCharge, setAddingCharge] = useState(false);

    // Form states
    const [newSubscription, setNewSubscription] = useState({
        service_type: 'hosting' as ServiceType,
        service_name: '',
        monthly_amount: '',
        commission_percent: '0',
    });
    const [newCharge, setNewCharge] = useState({ description: '', amount: '' });

    useEffect(() => {
        async function fetchClient() {
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
        }
        fetchClient();
    }, [resolvedParams.id]);

    // Cancel subscription
    async function handleCancelSubscription(subscriptionId: string) {
        if (!confirm('Êtes-vous sûr de vouloir annuler cet abonnement ?')) return;

        try {
            const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to cancel subscription');

            // Refresh client data
            const clientResponse = await fetch(`/api/clients/${resolvedParams.id}`);
            const data = await clientResponse.json();
            setClient(data.client);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error cancelling subscription');
        }
    }

    // Initiate client cancellation
    async function handleInitiateCancellation() {
        if (!confirm('Êtes-vous sûr de vouloir initier la résiliation du contrat ? Un email sera envoyé au client.')) return;

        setCancelling(true);
        try {
            const response = await fetch(`/api/clients/${resolvedParams.id}/cancel`, {
                method: 'POST',
            });
            if (!response.ok) throw new Error('Failed to initiate cancellation');

            // Refresh client data
            const clientResponse = await fetch(`/api/clients/${resolvedParams.id}`);
            const data = await clientResponse.json();
            setClient(data.client);

            alert('Un email de confirmation a été envoyé au client.');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error initiating cancellation');
        } finally {
            setCancelling(false);
        }
    }

    // Generate Contract PDF
    async function handleGenerateContract() {
        setLoading(true); // Re-using loading state or create a new one?
        // Let's use a local loading state to not hide the whole UI
    }

    const [generatingContract, setGeneratingContract] = useState(false);

    // Add subscription
    async function handleAddSubscription() {
        if (!newSubscription.monthly_amount) {
            alert('Veuillez entrer un montant mensuel');
            return;
        }
        setAddingSubscription(true);
        try {
            const response = await fetch('/api/subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: resolvedParams.id,
                    service_type: newSubscription.service_type,
                    service_name: newSubscription.service_name || null,
                    monthly_amount: parseFloat(newSubscription.monthly_amount),
                    commission_percent: parseFloat(newSubscription.commission_percent),
                }),
            });
            if (!response.ok) throw new Error('Failed to add subscription');

            // Refresh client data
            const clientResponse = await fetch(`/api/clients/${resolvedParams.id}`);
            const data = await clientResponse.json();
            setClient(data.client);
            setShowAddSubscription(false);
            setNewSubscription({ service_type: 'hosting', service_name: '', monthly_amount: '', commission_percent: '0' });
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erreur');
        } finally {
            setAddingSubscription(false);
        }
    }

    // Add one-time charge
    async function handleAddCharge() {
        if (!newCharge.description || !newCharge.amount) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        setAddingCharge(true);
        try {
            const response = await fetch('/api/one-time-charges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: resolvedParams.id,
                    description: newCharge.description,
                    amount: parseFloat(newCharge.amount),
                }),
            });
            if (!response.ok) throw new Error('Failed to add charge');

            // Refresh client data
            const clientResponse = await fetch(`/api/clients/${resolvedParams.id}`);
            const data = await clientResponse.json();
            setClient(data.client);
            setShowAddCharge(false);
            setNewCharge({ description: '', amount: '' });
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erreur');
        } finally {
            setAddingCharge(false);
        }
    }

    async function generateContract() {
        setGeneratingContract(true);
        try {
            const response = await fetch(`/api/clients/${resolvedParams.id}/generate-contract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) // Can pass quoteId if needed later
            });

            if (!response.ok) throw new Error('Failed to generate contract');

            // Handle PDF download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Contrat-${client?.company_name}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            console.error(e);
            alert('Erreur lors de la génération du contrat');
        } finally {
            setGeneratingContract(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-500">Chargement...</p>
                </div>
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error || 'Client not found'}</p>
                    <Link href="/admin/clients" className="text-blue-600 hover:underline">
                        Retour à la liste
                    </Link>
                </div>
            </div>
        );
    }

    const activeSubscriptions = client.subscriptions.filter(s => s.status === 'active');

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back button */}
                <Link
                    href="/admin/clients"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Retour aux clients
                </Link>

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                            <Building2 size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{client.company_name}</h1>
                            <p className="text-gray-500">{client.contact_name}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status={client.status} />
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${client.client_type === 'new'
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-purple-50 text-purple-600 border-purple-100'
                            }`}>
                            <CreditCard size={14} />
                            {client.client_type === 'new' ? 'SEPA' : 'Legacy'}
                        </span>

                        {/* Generate Contract Button in Header */}
                        <button
                            onClick={generateContract}
                            disabled={generatingContract}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {generatingContract ? <Loader2 size={16} className="animate-spin" /> : <FileSignature size={16} />}
                            Générer Contrat
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm text-gray-400 font-medium">Revenu Mensuel</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">€{client.total_monthly.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm text-gray-400 font-medium">Abonnements Actifs</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{activeSubscriptions.length}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm text-gray-400 font-medium">Factures</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{client.invoices.length}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm text-gray-400 font-medium">Client depuis</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {new Date(client.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left column - Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Contact Info */}
                        <Section title="Informations" icon={Building2}>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Mail size={18} className="text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-400 font-medium">Email</p>
                                        <p className="text-gray-900">{client.email}</p>
                                    </div>
                                </div>
                                {client.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone size={18} className="text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-400 font-medium">Téléphone</p>
                                            <p className="text-gray-900">{client.phone}</p>
                                        </div>
                                    </div>
                                )}
                                {client.address && (
                                    <div className="flex items-start gap-3">
                                        <MapPin size={18} className="text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-400 font-medium">Adresse</p>
                                            <p className="text-gray-900 font-medium">
                                                {client.address}<br />
                                                {client.postal_code} {client.city}<br />
                                                {client.country}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {client.vat_number && (
                                    <div className="flex items-start gap-3">
                                        <FileText size={18} className="text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-400 font-medium">N° TVA</p>
                                            <p className="text-gray-900 font-mono">{client.vat_number}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Section>

                        {/* SEPA Mandate */}
                        <Section title="Mandat SEPA" icon={CreditCard}>
                            {client.mandate ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Statut</span>
                                        <span className={`px-2 py-0.5 border rounded text-xs font-semibold ${client.mandate.status === 'active'
                                            ? 'bg-green-50 text-green-600 border-green-100'
                                            : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                                            }`}>
                                            {client.mandate.status === 'active' ? 'Actif' : 'En attente'}
                                        </span>
                                    </div>
                                    {client.mandate.iban_last4 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500">IBAN</span>
                                            <span className="text-gray-900 font-mono font-medium">**** **** **** {client.mandate.iban_last4}</span>
                                        </div>
                                    )}
                                    {client.mandate.bank_name && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500">Banque</span>
                                            <span className="text-gray-900 font-medium">{client.mandate.bank_name}</span>
                                        </div>
                                    )}
                                </div>
                            ) : client.client_type === 'new' ? (
                                <div className="text-center py-4">
                                    <AlertCircle size={24} className="text-orange-400 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">Aucun mandat SEPA configuré</p>
                                    <button className="mt-3 text-sm text-blue-400 hover:underline">
                                        Envoyer demande de mandat
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-gray-500 text-sm">Client Legacy - Pas de SEPA</p>
                                    {client.sepa_exception && (
                                        <p className="text-xs text-gray-600 mt-2">
                                            Exception: {client.sepa_exception_reason}
                                        </p>
                                    )}
                                </div>
                            )}
                        </Section>

                        {/* Notes (admin only) */}
                        {client.notes && (
                            <Section title="Notes internes" icon={FileText}>
                                <p className="text-gray-300 whitespace-pre-wrap">{client.notes}</p>
                            </Section>
                        )}

                        {/* Actions */}
                        <Section title="Actions" icon={Edit}>
                            <div className="space-y-3">
                                <Link
                                    href={`/admin/clients/${client.id}/edit`}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                                >
                                    <Edit size={18} />
                                    Modifier le client
                                </Link>

                                <Link
                                    href={`/admin/clients/${client.id}/invoice`}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-medium transition-colors"
                                >
                                    <Receipt size={18} />
                                    Créer une facture
                                </Link>

                                {client.status === 'active' && (
                                    <button
                                        onClick={handleInitiateCancellation}
                                        disabled={cancelling}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        {cancelling ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Ban size={18} />
                                        )}
                                        Initier résiliation
                                    </button>
                                )}
                            </div>
                        </Section>
                    </div>

                    {/* Right column - Subscriptions & Invoices */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Contracts */}
                        <Section title="Contrats" icon={FileSignature}>
                            {client.contracts && client.contracts.length > 0 ? (
                                <div className="space-y-3">
                                    {client.contracts.map((contract) => (
                                        <div key={contract.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-gray-900">Contrat de Service</p>
                                                    <span className={`px-2 py-0.5 border rounded text-xs font-semibold ${contract.status === 'signed' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                                                        }`}>
                                                        {contract.status === 'signed' ? 'Signé' : contract.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Signé le {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString('fr-FR') : '-'}
                                                </p>
                                                {contract.valid_until && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Valide jusqu'au {new Date(contract.valid_until).toLocaleDateString('fr-FR')}
                                                    </p>
                                                )}
                                            </div>
                                            <a
                                                href={contract.document_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Voir PDF
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <FileText size={32} className="text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500">Aucun contrat signé</p>
                                    <button
                                        onClick={generateContract}
                                        disabled={generatingContract}
                                        className="mt-2 text-sm text-blue-500 hover:underline disabled:opacity-50"
                                    >
                                        {generatingContract ? 'Génération...' : 'Générer un contrat'}
                                    </button>
                                </div>
                            )}
                        </Section>

                        {/* Quotes / Devis */}
                        <Section title="Devis" icon={FileText}>
                            {client.quotes && client.quotes.length > 0 ? (
                                <div className="space-y-3">
                                    {client.quotes.map((quote) => (
                                        <div key={quote.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-gray-900">{quote.quote_number}</p>
                                                    <span className={`px-2 py-0.5 border rounded text-xs font-semibold ${quote.status === 'signed' ? 'bg-green-50 text-green-600 border-green-100' :
                                                        quote.status === 'sent' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            'bg-gray-50 text-gray-500 border-gray-200'
                                                        }`}>
                                                        {quote.status === 'signed' ? 'Signé' :
                                                            quote.status === 'sent' ? 'Envoyé' :
                                                                quote.status === 'draft' ? 'Brouillon' :
                                                                    quote.status === 'expired' ? 'Expiré' : 'Refusé'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    {quote.signed_at
                                                        ? `Signé le ${new Date(quote.signed_at).toLocaleDateString('fr-FR')}`
                                                        : `Créé le ${new Date(quote.created_at).toLocaleDateString('fr-FR')}`
                                                    }
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="text-lg font-bold text-gray-900">€{quote.total.toFixed(2)}</p>
                                                <Link
                                                    href={`/quote/${quote.quote_number}/sign`}
                                                    target="_blank"
                                                    className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                                >
                                                    Voir
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <FileText size={32} className="text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500">Aucun devis</p>
                                </div>
                            )}
                        </Section>

                        {/* Subscriptions */}
                        <Section
                            title="Abonnements"
                            icon={Euro}
                            action={
                                <button
                                    onClick={() => setShowAddSubscription(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                >
                                    <Plus size={16} />
                                    Ajouter
                                </button>
                            }
                        >
                            {client.subscriptions.length === 0 ? (
                                <p className="text-gray-500 text-center py-6">Aucun abonnement</p>
                            ) : (
                                <div className="space-y-3">
                                    {client.subscriptions.map((sub) => (
                                        <div
                                            key={sub.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-gray-900">
                                                        {sub.service_name || serviceTypeLabels[sub.service_type]}
                                                    </p>
                                                    <SubscriptionBadge status={sub.status} />
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    {serviceTypeLabels[sub.service_type]}
                                                    {sub.commission_percent > 0 && ` • ${sub.commission_percent}% commission`}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    <Calendar size={12} className="inline mr-1" />
                                                    Depuis {new Date(sub.started_at).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div>
                                                    <p className="text-lg font-bold text-gray-900">€{sub.monthly_amount}</p>
                                                    <p className="text-xs text-gray-400 font-medium">/mois</p>
                                                </div>
                                                {sub.status === 'active' && (
                                                    <button
                                                        onClick={() => handleCancelSubscription(sub.id)}
                                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Annuler l'abonnement"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {/* Recent Invoices */}
                        <Section
                            title="Factures récentes"
                            icon={Receipt}
                            action={
                                <Link
                                    href={`/admin/clients/${client.id}/invoices`}
                                    className="text-sm text-blue-400 hover:underline"
                                >
                                    Voir tout
                                </Link>
                            }
                        >
                            {client.invoices.length === 0 ? (
                                <p className="text-gray-500 text-center py-6">Aucune facture</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-sm text-gray-500">
                                                <th className="pb-3 font-semibold">N° Facture</th>
                                                <th className="pb-3 font-semibold">Date</th>
                                                <th className="pb-3 font-semibold">Statut</th>
                                                <th className="pb-3 text-right font-semibold">Montant</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {client.invoices.slice(0, 5).map((invoice) => (
                                                <tr key={invoice.id} className="text-sm">
                                                    <td className="py-3 font-medium text-gray-900">
                                                        <Link
                                                            href={`/admin/invoices/${invoice.id}`}
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {invoice.invoice_number}
                                                        </Link>
                                                    </td>
                                                    <td className="py-3 text-gray-500 font-medium">
                                                        {new Date(invoice.issued_at).toLocaleDateString('fr-FR')}
                                                    </td>
                                                    <td className="py-3">
                                                        <InvoiceBadge status={invoice.status} />
                                                    </td>
                                                    <td className="py-3 text-right text-gray-900 font-bold">
                                                        €{invoice.total.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Section>

                        {/* Cancellation Info */}
                        {client.status === 'pending_cancellation' && (
                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-orange-500/20 rounded-lg">
                                        <FileSignature size={24} className="text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-orange-400 mb-2">
                                            Résiliation en cours
                                        </h3>
                                        <p className="text-gray-300 mb-2">
                                            Demande effectuée le {new Date(client.cancellation_requested_at!).toLocaleDateString('fr-FR')}
                                        </p>
                                        {client.cancellation_effective_at && (
                                            <p className="text-gray-400">
                                                Date effective : <strong className="text-white">
                                                    {new Date(client.cancellation_effective_at).toLocaleDateString('fr-FR')}
                                                </strong>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* One-Time Charges / Services Ponctuels */}
                        <Section
                            title="Services Ponctuels"
                            icon={Receipt}
                            action={
                                <button
                                    onClick={() => setShowAddCharge(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                >
                                    <Plus size={16} />
                                    Ajouter
                                </button>
                            }
                        >
                            {client.oneTimeCharges && client.oneTimeCharges.length > 0 ? (
                                <div className="space-y-3">
                                    {client.oneTimeCharges.filter(c => !c.invoiced).map((charge) => (
                                        <div key={charge.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <p className="font-bold text-gray-900">{charge.description}</p>
                                                <p className="text-sm text-gray-500">
                                                    Ajouté le {new Date(charge.created_at).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-900">€{charge.amount.toFixed(2)}</p>
                                                <span className="text-xs text-orange-600 font-semibold">À facturer</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Receipt size={32} className="text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500">Aucun service ponctuel en attente</p>
                                </div>
                            )}
                        </Section>
                    </div>
                </div>
            </div>

            {/* Add Subscription Modal */}
            {showAddSubscription && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un abonnement</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type de service</label>
                                <select
                                    value={newSubscription.service_type}
                                    onChange={(e) => setNewSubscription({ ...newSubscription, service_type: e.target.value as ServiceType })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                >
                                    {Object.entries(serviceTypeLabels).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du service (optionnel)</label>
                                <input
                                    type="text"
                                    value={newSubscription.service_name}
                                    onChange={(e) => setNewSubscription({ ...newSubscription, service_name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="Ex: Pack Business"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Montant mensuel (€)</label>
                                <input
                                    type="number"
                                    value={newSubscription.monthly_amount}
                                    onChange={(e) => setNewSubscription({ ...newSubscription, monthly_amount: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Commission (%)</label>
                                <input
                                    type="number"
                                    value={newSubscription.commission_percent}
                                    onChange={(e) => setNewSubscription({ ...newSubscription, commission_percent: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddSubscription(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAddSubscription}
                                disabled={addingSubscription}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 disabled:opacity-50"
                            >
                                {addingSubscription ? 'Ajout...' : 'Ajouter'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add One-Time Charge Modal */}
            {showAddCharge && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un service ponctuel</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={newCharge.description}
                                    onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="Ex: Création logo, développement supplémentaire..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (€)</label>
                                <input
                                    type="number"
                                    value={newCharge.amount}
                                    onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddCharge(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAddCharge}
                                disabled={addingCharge}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 disabled:opacity-50"
                            >
                                {addingCharge ? 'Ajout...' : 'Ajouter'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
