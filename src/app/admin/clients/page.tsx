// Admin Clients List Page
// Path: /admin/clients

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    Search,
    Filter,
    Building2,
    Mail,
    Phone,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    UserPlus,
    CreditCard,
    Loader2,
    ChevronRight
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
            className: 'bg-green-50 text-green-600 border-green-100'
        },
        inactive: {
            icon: XCircle,
            label: 'Inactif',
            className: 'bg-gray-50 text-gray-400 border-gray-200'
        },
        pending_cancellation: {
            icon: Clock,
            label: 'Résiliation',
            className: 'bg-orange-50 text-orange-600 border-orange-100'
        },
        pending_confirmation: {
            icon: AlertCircle,
            label: 'À confirmer',
            className: 'bg-yellow-50 text-yellow-600 border-yellow-100'
        },
        prospect: {
            icon: UserPlus,
            label: 'Prospect',
            className: 'bg-blue-50 text-blue-600 border-blue-100'
        },
    };

    const { icon: Icon, label, className } = config[status];

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${className}`}>
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
            className: 'bg-purple-50 text-purple-600 border-purple-100'
        },
        new: {
            label: 'SEPA',
            icon: CreditCard,
            className: 'bg-blue-50 text-blue-600 border-blue-100'
        },
    };

    const { label, className, icon: Icon } = config[type] as { label: string; className: string; icon?: typeof CreditCard };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${className}`}>
            {Icon && <Icon size={12} />}
            {label}
        </span>
    );
}

export default function AdminClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
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
        if (!searchTerm) return true;
        const query = searchTerm.toLowerCase();
        return (
            client.company_name.toLowerCase().includes(query) ||
            client.contact_name.toLowerCase().includes(query) ||
            client.email.toLowerCase().includes(query)
        );
    });

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Users size={32} className="text-blue-500" />
                            Gestion des Clients
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Annuaires des restaurateurs et commerçants
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm text-gray-400 font-medium">Total Clients</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{clients.length}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm text-gray-400 font-medium">Clients Actifs</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">
                            {clients.filter(c => c.status === 'active').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm text-gray-400 font-medium">Revenu Mensuel</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">
                            €{clients.reduce((acc, c) => acc + (c.total_monthly || 0), 0).toFixed(0)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm text-gray-400 font-medium">Nouveaux (30j)</p>
                        <p className="text-2xl font-bold text-purple-600 mt-1">
                            {clients.filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 relative min-w-[200px]">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un client ou email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <div className="relative">
                            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as ClientStatus | 'all')}
                                className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="active">Actifs</option>
                                <option value="pending_cancellation">Résiliation en cours</option>
                                <option value="inactive">Inactifs</option>
                                <option value="pending_confirmation">À confirmer</option>
                                <option value="prospect">Prospect</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-12 text-center">
                        <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-500">Chargement des clients...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
                        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <p className="text-red-600">{error}</p>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-12 text-center">
                        <Users size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">Aucun client trouvé</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClients.map((client) => (
                            <Link
                                key={client.id}
                                href={`/admin/clients/${client.id}`}
                                className="group bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <Building2 size={24} />
                                    </div>
                                    <StatusBadge status={client.status} />
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                    {client.company_name}
                                </h3>
                                <p className="text-gray-500 text-sm mb-4">{client.contact_name}</p>

                                <div className="space-y-2 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Mail size={14} className="text-gray-400" />
                                        <span className="truncate">{client.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-4">
                                        <TypeBadge type={client.client_type} />
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Mensuel</p>
                                            <p className="text-gray-900 font-bold">€{(client.total_monthly || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-gray-50">
                                    Détails du compte <ChevronRight size={16} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
