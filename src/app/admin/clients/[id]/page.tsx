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
        active: { icon: CheckCircle, label: 'Actif', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
        inactive: { icon: XCircle, label: 'Inactif', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
        pending_cancellation: { icon: Clock, label: 'Résiliation en cours', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    };
    const { icon: Icon, label, className } = config[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${className}`}>
            <Icon size={14} />
            {label}
        </span>
    );
}

// Subscription status badge
function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
    const config = {
        active: { label: 'Actif', className: 'bg-green-500/10 text-green-400' },
        paused: { label: 'Pausé', className: 'bg-yellow-500/10 text-yellow-400' },
        cancelled: { label: 'Annulé', className: 'bg-red-500/10 text-red-400' },
    };
    const { label, className } = config[status];
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>{label}</span>;
}

// Invoice status badge
function InvoiceBadge({ status }: { status: Invoice['status'] }) {
    const config = {
        draft: { label: 'Brouillon', className: 'bg-gray-500/10 text-gray-400' },
        sent: { label: 'Envoyée', className: 'bg-blue-500/10 text-blue-400' },
        paid: { label: 'Payée', className: 'bg-green-500/10 text-green-400' },
        overdue: { label: 'En retard', className: 'bg-red-500/10 text-red-400' },
        cancelled: { label: 'Annulée', className: 'bg-gray-500/10 text-gray-400' },
    };
    const { label, className } = config[status];
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>{label}</span>;
}

// Section component
function Section({ title, icon: Icon, children, action }: {
    title: string;
    icon: typeof Building2;
    children: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Icon size={20} className="text-blue-400" />
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
            const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
                method: 'POST',
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-400">Chargement...</p>
                </div>
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                    <p className="text-red-400 mb-4">{error || 'Client not found'}</p>
                    <Link href="/admin/clients" className="text-blue-400 hover:underline">
                        Retour à la liste
                    </Link>
                </div>
            </div>
        );
    }

    const activeSubscriptions = client.subscriptions.filter(s => s.status === 'active');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back button */}
                <Link
                    href="/admin/clients"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Retour aux clients
                </Link>

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Building2 size={32} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">{client.company_name}</h1>
                            <p className="text-gray-400">{client.contact_name}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status={client.status} />
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${client.client_type === 'new'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            }`}>
                            <CreditCard size={14} />
                            {client.client_type === 'new' ? 'SEPA' : 'Legacy'}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5">
                        <p className="text-sm text-gray-400">Revenu Mensuel</p>
                        <p className="text-2xl font-bold text-white mt-1">€{client.total_monthly.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5">
                        <p className="text-sm text-gray-400">Abonnements Actifs</p>
                        <p className="text-2xl font-bold text-white mt-1">{activeSubscriptions.length}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5">
                        <p className="text-sm text-gray-400">Factures</p>
                        <p className="text-2xl font-bold text-white mt-1">{client.invoices.length}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5">
                        <p className="text-sm text-gray-400">Client depuis</p>
                        <p className="text-2xl font-bold text-white mt-1">
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
                                    <Mail size={18} className="text-gray-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-400">Email</p>
                                        <p className="text-white">{client.email}</p>
                                    </div>
                                </div>
                                {client.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone size={18} className="text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-400">Téléphone</p>
                                            <p className="text-white">{client.phone}</p>
                                        </div>
                                    </div>
                                )}
                                {client.address && (
                                    <div className="flex items-start gap-3">
                                        <MapPin size={18} className="text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-400">Adresse</p>
                                            <p className="text-white">
                                                {client.address}<br />
                                                {client.postal_code} {client.city}<br />
                                                {client.country}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {client.vat_number && (
                                    <div className="flex items-start gap-3">
                                        <FileText size={18} className="text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-400">N° TVA</p>
                                            <p className="text-white">{client.vat_number}</p>
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
                                        <span className="text-gray-400">Statut</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${client.mandate.status === 'active'
                                                ? 'bg-green-500/10 text-green-400'
                                                : 'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {client.mandate.status === 'active' ? 'Actif' : 'En attente'}
                                        </span>
                                    </div>
                                    {client.mandate.iban_last4 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400">IBAN</span>
                                            <span className="text-white">**** **** **** {client.mandate.iban_last4}</span>
                                        </div>
                                    )}
                                    {client.mandate.bank_name && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400">Banque</span>
                                            <span className="text-white">{client.mandate.bank_name}</span>
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
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg font-medium transition-colors"
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
                        {/* Subscriptions */}
                        <Section
                            title="Abonnements"
                            icon={Euro}
                            action={
                                <Link
                                    href={`/admin/clients/${client.id}/subscriptions/new`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                >
                                    <Plus size={16} />
                                    Ajouter
                                </Link>
                            }
                        >
                            {client.subscriptions.length === 0 ? (
                                <p className="text-gray-500 text-center py-6">Aucun abonnement</p>
                            ) : (
                                <div className="space-y-3">
                                    {client.subscriptions.map((sub) => (
                                        <div
                                            key={sub.id}
                                            className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium text-white">
                                                        {sub.service_name || serviceTypeLabels[sub.service_type]}
                                                    </p>
                                                    <SubscriptionBadge status={sub.status} />
                                                </div>
                                                <p className="text-sm text-gray-400">
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
                                                    <p className="text-lg font-bold text-white">€{sub.monthly_amount}</p>
                                                    <p className="text-xs text-gray-500">/mois</p>
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
                                                <th className="pb-3">N° Facture</th>
                                                <th className="pb-3">Date</th>
                                                <th className="pb-3">Statut</th>
                                                <th className="pb-3 text-right">Montant</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {client.invoices.slice(0, 5).map((invoice) => (
                                                <tr key={invoice.id} className="text-sm">
                                                    <td className="py-3">
                                                        <Link
                                                            href={`/admin/invoices/${invoice.id}`}
                                                            className="text-blue-400 hover:underline"
                                                        >
                                                            {invoice.invoice_number}
                                                        </Link>
                                                    </td>
                                                    <td className="py-3 text-gray-400">
                                                        {new Date(invoice.issued_at).toLocaleDateString('fr-FR')}
                                                    </td>
                                                    <td className="py-3">
                                                        <InvoiceBadge status={invoice.status} />
                                                    </td>
                                                    <td className="py-3 text-right text-white font-medium">
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
                    </div>
                </div>
            </div>
        </div>
    );
}
