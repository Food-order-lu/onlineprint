// Admin Clients List Page
// Path: /admin/clients

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    UserPlus,
    Search,
    Filter,
    Building2,
    Mail,
    Phone,
    AlertCircle,
    Clock,
    CheckCircle,
    XCircle,
    CreditCard,
    Euro
} from 'lucide-react';

// Types
type ClientStatus = 'active' | 'inactive' | 'pending_cancellation' | 'pending_confirmation' | 'prospect';
type ClientType = 'legacy' | 'new';

interface Client {
    id: string;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string | null;
    status: ClientStatus;
    client_type: ClientType;
    created_at: string;
    total_monthly?: number;
    has_mandate?: boolean;
}

// Status badge component
function StatusBadge({ status }: { status: ClientStatus }) {
    const config = {
        active: {
            icon: CheckCircle,
            label: 'Actif',
            className: 'bg-green-500/10 text-green-400 border-green-500/20'
        },
        inactive: {
            icon: XCircle,
            label: 'Inactif',
            className: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        },
        pending_cancellation: {
            icon: Clock,
            label: 'Résiliation',
            className: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        },
        pending_confirmation: {
            icon: AlertCircle,
            label: 'À confirmer',
            className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
        },
        prospect: {
            icon: UserPlus,
            label: 'Prospect',
            className: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        },
    };

    const { icon: Icon, label, className } = config[status];

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${className}`}>
            <Icon size={12} />
            {label}
        </span>
    );
}

// Client type badge
function TypeBadge({ type }: { type: ClientType }) {
    const config = {
        legacy: {
            label: 'Legacy',
            className: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        },
        new: {
            label: 'SEPA',
            icon: CreditCard,
            className: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        },
    };

    const { label, className, icon: Icon } = config[type] as { label: string; className: string; icon?: typeof CreditCard };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${className}`}>
            {Icon && <Icon size={12} />}
            {label}
        </span>
    );
}

// Stats card
function StatsCard({
    title,
    value,
    icon: Icon,
    color
}: {
    title: string;
    value: number | string;
    icon: typeof Users;
    color: string;
}) {
    return (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon size={24} className="text-white" />
                </div>
            </div>
        </div>
    );
}

export default function AdminClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<ClientType | 'all'>('all');

    // Fetch clients
    useEffect(() => {
        async function fetchClients() {
            try {
                const params = new URLSearchParams();
                if (statusFilter !== 'all') params.set('status', statusFilter);
                if (typeFilter !== 'all') params.set('type', typeFilter);

                const response = await fetch(`/api/clients?${params.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch clients');

                const data = await response.json();
                setClients(data.clients);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        }

        fetchClients();
    }, [statusFilter, typeFilter]);

    // Filter clients by search
    const filteredClients = clients.filter(client => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            client.company_name.toLowerCase().includes(query) ||
            client.contact_name.toLowerCase().includes(query) ||
            client.email.toLowerCase().includes(query)
        );
    });

    // Stats
    const stats = {
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        legacy: clients.filter(c => c.client_type === 'legacy').length,
        new: clients.filter(c => c.client_type === 'new').length,
        pendingCancellation: clients.filter(c => c.status === 'pending_cancellation').length,
        totalMRR: clients.reduce((sum, c) => sum + (c.total_monthly || 0), 0),
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Users className="text-blue-400" />
                            Gestion des Clients
                        </h1>
                        <p className="text-gray-400 mt-1">
                            Gérez vos clients, abonnements et facturations
                        </p>
                    </div>

                    <Link
                        href="/admin/clients/new"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                    >
                        <UserPlus size={20} />
                        Nouveau Client
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatsCard
                        title="Total Clients"
                        value={stats.total}
                        icon={Users}
                        color="bg-blue-600"
                    />
                    <StatsCard
                        title="Clients Actifs"
                        value={stats.active}
                        icon={CheckCircle}
                        color="bg-green-600"
                    />
                    <StatsCard
                        title="Clients SEPA"
                        value={stats.new}
                        icon={CreditCard}
                        color="bg-purple-600"
                    />
                    <StatsCard
                        title="MRR Total"
                        value={`€${stats.totalMRR.toFixed(2)}`}
                        icon={Euro}
                        color="bg-emerald-600"
                    />
                </div>

                {/* Filters */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as ClientStatus | 'all')}
                                className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none cursor-pointer"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="active">Actifs</option>
                                <option value="inactive">Inactifs</option>
                                <option value="pending_cancellation">En résiliation</option>
                            </select>
                        </div>

                        {/* Type Filter */}
                        <div className="relative">
                            <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as ClientType | 'all')}
                                className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none cursor-pointer"
                            >
                                <option value="all">Tous les types</option>
                                <option value="legacy">Legacy</option>
                                <option value="new">SEPA</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="text-red-400" />
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-gray-400">Chargement des clients...</p>
                    </div>
                )}

                {/* Clients Table */}
                {!loading && !error && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Entreprise</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Contact</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Type</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Statut</th>
                                        <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Mensuel</th>
                                        <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredClients.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                Aucun client trouvé
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredClients.map((client) => (
                                            <tr
                                                key={client.id}
                                                className="hover:bg-white/5 transition-colors cursor-pointer"
                                                onClick={() => window.location.href = `/admin/clients/${client.id}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                            <Building2 size={20} className="text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white">{client.company_name}</p>
                                                            <p className="text-sm text-gray-500">{client.contact_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                                            <Mail size={14} className="text-gray-500" />
                                                            {client.email}
                                                        </div>
                                                        {client.phone && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                                <Phone size={14} className="text-gray-500" />
                                                                {client.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <TypeBadge type={client.client_type} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={client.status} />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-white font-medium">
                                                        €{(client.total_monthly || 0).toFixed(2)}
                                                    </span>
                                                    <span className="text-gray-500 text-sm">/mois</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={`/admin/clients/${client.id}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    >
                                                        Voir détails
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
