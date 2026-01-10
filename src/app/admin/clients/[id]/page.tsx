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

    // Form states
    const [newSubscription, setNewSubscription] = useState({
        service_type: 'hosting' as ServiceType,
        service_name: '',
        monthly_amount: '',
        commission_percent: '0',
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

    const handleInitiateCancellation = async () => {
        if (!confirm('Initier la résiliation ?')) return;
        setCancelling(true);
        try {
            const response = await fetch(`/api/clients/${resolvedParams.id}/cancel`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed');
            await fetchClient();
            alert('Résiliation initiée');
        } catch (e) {
            alert('Erreur');
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
                    client_id: resolvedParams.id,
                    ...newSubscription,
                    monthly_amount: parseFloat(newSubscription.monthly_amount),
                    commission_percent: parseFloat(newSubscription.commission_percent),
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

    const handleGenerateInvoice = async () => {
        if (!confirm('Voulez-vous générer une facture pour les abonnements et frais en attente ?\nNote: Cela marquera les frais comme facturés.')) return;

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
                                </div>
                            )}
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
                                        <div>
                                            <p className="font-bold text-gray-900">{sub.service_name || serviceTypeLabels[sub.service_type]}</p>
                                            <p className="text-sm text-gray-400">{serviceTypeLabels[sub.service_type]}</p>
                                        </div>
                                        <p className="text-xl font-black text-gray-900">{sub.monthly_amount.toFixed(2)}€<span className="text-xs text-gray-400">/mois</span></p>
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
                                    <span className="text-gray-600">Frais uniques / Prorata</span>
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
                    </div>
                </div>
            </div>
        </div>
    );
}
