// Client Dashboard Page
// Path: /client
// Limited view - no discounts, margins, or other clients visible

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Building2,
    FileText,
    CreditCard,
    Receipt,
    Settings,
    LogOut,
    CheckCircle,
    Clock,
    AlertCircle,
    Euro,
    Calendar,
    ExternalLink
} from 'lucide-react';

// Types (Public view - no sensitive fields)
interface Subscription {
    id: string;
    service_type: string;
    service_name: string | null;
    monthly_amount: number;
    status: 'active' | 'paused' | 'cancelled';
    started_at: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
    total: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    issued_at: string;
    due_at: string | null;
}

interface Mandate {
    status: 'pending' | 'active' | 'cancelled' | 'failed';
    iban_last4: string | null;
    bank_name: string | null;
}

interface ClientData {
    company_name: string;
    contact_name: string;
    email: string;
    subscriptions: Subscription[];
    invoices: Invoice[];
    mandate: Mandate | null;
    total_monthly: number;
}

// Service type labels
const serviceLabels: Record<string, string> = {
    hosting: 'Hébergement',
    online_ordering: 'Commandes en ligne',
    table_reservation: 'Réservation de table',
    website: 'Site Web',
    maintenance: 'Maintenance',
    other: 'Autre',
};

// Invoice status
function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
    const config = {
        draft: { label: 'Brouillon', className: 'bg-gray-500/10 text-gray-400', icon: Clock },
        sent: { label: 'En attente', className: 'bg-blue-500/10 text-blue-400', icon: Clock },
        paid: { label: 'Payée', className: 'bg-green-500/10 text-green-400', icon: CheckCircle },
        overdue: { label: 'En retard', className: 'bg-red-500/10 text-red-400', icon: AlertCircle },
    };
    const { label, className, icon: Icon } = config[status];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${className}`}>
            <Icon size={12} />
            {label}
        </span>
    );
}

export default function ClientDashboard() {
    const [data, setData] = useState<ClientData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/client/dashboard');
                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = '/login';
                        return;
                    }
                    throw new Error('Failed to load data');
                }
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                    <p className="text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    const activeSubscriptions = data.subscriptions.filter(s => s.status === 'active');
    const pendingInvoices = data.invoices.filter(i => i.status === 'sent' || i.status === 'overdue');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <header className="bg-white/5 border-b border-white/10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Building2 size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">{data.company_name}</h1>
                                <p className="text-sm text-gray-400">{data.contact_name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href="/client/settings"
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Settings size={20} />
                            </Link>
                            <Link
                                href="/logout"
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <LogOut size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white">Bonjour, {data.contact_name.split(' ')[0]} 👋</h2>
                    <p className="text-gray-400 mt-1">Bienvenue dans votre espace client</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <Euro size={18} className="text-blue-400" />
                            <p className="text-sm text-gray-400">Montant mensuel</p>
                        </div>
                        <p className="text-2xl font-bold text-white">€{data.total_monthly.toFixed(2)}</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText size={18} className="text-green-400" />
                            <p className="text-sm text-gray-400">Services actifs</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{activeSubscriptions.length}</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <Receipt size={18} className="text-orange-400" />
                            <p className="text-sm text-gray-400">Factures en attente</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{pendingInvoices.length}</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <CreditCard size={18} className="text-purple-400" />
                            <p className="text-sm text-gray-400">Prélèvement</p>
                        </div>
                        <p className={`text-lg font-bold ${data.mandate?.status === 'active' ? 'text-green-400' : 'text-orange-400'}`}>
                            {data.mandate?.status === 'active' ? 'Actif' : 'Non configuré'}
                        </p>
                    </div>
                </div>

                {/* SEPA Warning if not configured */}
                {(!data.mandate || data.mandate.status !== 'active') && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-8">
                        <div className="flex items-start gap-4">
                            <AlertCircle size={24} className="text-orange-400 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-orange-400 font-medium">Prélèvement non configuré</p>
                                <p className="text-sm text-gray-300 mt-1">
                                    Pour automatiser vos paiements mensuels, configurez le prélèvement SEPA.
                                </p>
                            </div>
                            <Link
                                href="/client/setup-mandate"
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Configurer
                            </Link>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Active Services */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FileText size={20} className="text-blue-400" />
                                Mes Services
                            </h3>
                        </div>
                        <div className="p-6">
                            {activeSubscriptions.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">Aucun service actif</p>
                            ) : (
                                <div className="space-y-4">
                                    {activeSubscriptions.map((sub) => (
                                        <div key={sub.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                            <div>
                                                <p className="font-medium text-white">
                                                    {sub.service_name || serviceLabels[sub.service_type] || sub.service_type}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    <Calendar size={12} className="inline mr-1" />
                                                    Depuis {new Date(sub.started_at).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-white">€{sub.monthly_amount}</p>
                                                <p className="text-xs text-gray-500">/mois</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Invoices */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Receipt size={20} className="text-blue-400" />
                                Mes Factures
                            </h3>
                            <Link href="/client/invoices" className="text-sm text-blue-400 hover:underline">
                                Voir tout
                            </Link>
                        </div>
                        <div className="p-6">
                            {data.invoices.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">Aucune facture</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.invoices.slice(0, 5).map((invoice) => (
                                        <div key={invoice.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                            <div>
                                                <p className="font-medium text-white">{invoice.invoice_number}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(invoice.issued_at).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-white mb-1">€{invoice.total.toFixed(2)}</p>
                                                <InvoiceStatusBadge status={invoice.status} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SEPA Info */}
                {data.mandate?.status === 'active' && (
                    <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                            <CreditCard size={20} className="text-green-400" />
                            Prélèvement automatique
                        </h3>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-gray-400">
                                    <span className="text-gray-500">IBAN:</span>{' '}
                                    <span className="text-white">**** **** **** {data.mandate.iban_last4}</span>
                                </p>
                                {data.mandate.bank_name && (
                                    <p className="text-gray-400">
                                        <span className="text-gray-500">Banque:</span>{' '}
                                        <span className="text-white">{data.mandate.bank_name}</span>
                                    </p>
                                )}
                                <p className="text-sm text-gray-500">
                                    Prochain prélèvement : entre le 5 et le 10 du mois
                                </p>
                            </div>
                            <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-medium">
                                Actif
                            </span>
                        </div>
                    </div>
                )}

                {/* Help */}
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Une question ? Contactez-nous à{' '}
                        <a href="mailto:support@rivego.lu" className="text-blue-400 hover:underline">
                            support@rivego.lu
                        </a>
                    </p>
                </div>
            </main>
        </div>
    );
}
