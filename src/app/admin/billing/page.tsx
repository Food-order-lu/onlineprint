'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Plus,
    Calculator,
    CreditCard,
    FileSpreadsheet,
    Trash2,
    Building2,
} from 'lucide-react';

interface Client {
    id: string;
    name: string;
    email: string;
    hasHosting: boolean;
    hasOrderSystem: boolean;
    monthlyRevenue: number;
    commissionRate: number; // 5, 6, 7, etc.
    minCommission: number; // 60€ par défaut
}

// Calculate commission
const calculateCommission = (client: Client) => {
    let total = 0;
    let details: string[] = [];

    // Hosting: 20€/month
    if (client.hasHosting) {
        total += 25;
        details.push('Hébergement: 25€');
    }

    // Order system: variable rate based on client settings
    if (client.hasOrderSystem) {
        const rate = client.commissionRate || 6;
        const minAmount = client.minCommission || 60;
        const calculatedCommission = Math.round(client.monthlyRevenue * (rate / 100));

        if (calculatedCommission >= minAmount) {
            total += calculatedCommission;
            details.push(`Commande (${rate}%): ${calculatedCommission}€`);
        } else {
            total += minAmount;
            details.push(`Commande (min): ${minAmount}€`);
        }
    }

    return { total, details };
};

export default function BillingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<Client[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newClient, setNewClient] = useState({
        name: '',
        email: '',
        hasHosting: true,
        hasOrderSystem: false,
        monthlyRevenue: 0,
        commissionRate: 6,
        minCommission: 60,
    });

    useEffect(() => {
        const user = localStorage.getItem('rivego_user');
        if (!user) {
            router.push('/admin/login');
            return;
        }

        // Load clients from localStorage
        const savedClients = localStorage.getItem('rivego_billing_clients');
        if (savedClients) {
            setClients(JSON.parse(savedClients));
        }

        setLoading(false);
    }, [router]);

    // Save clients to localStorage whenever they change
    const saveClients = (updatedClients: Client[]) => {
        setClients(updatedClients);
        localStorage.setItem('rivego_billing_clients', JSON.stringify(updatedClients));
    };

    const addClient = () => {
        if (!newClient.name || !newClient.email) return;

        const client: Client = {
            id: Date.now().toString(),
            ...newClient,
        };

        saveClients([...clients, client]);
        setNewClient({
            name: '',
            email: '',
            hasHosting: true,
            hasOrderSystem: false,
            monthlyRevenue: 0,
            commissionRate: 6,
            minCommission: 60,
        });
        setShowAddForm(false);
    };

    const updateRevenue = (id: string, revenue: number) => {
        const updated = clients.map(c =>
            c.id === id ? { ...c, monthlyRevenue: revenue } : c
        );
        saveClients(updated);
    };

    const removeClient = (id: string) => {
        if (confirm('Supprimer ce client ?')) {
            saveClients(clients.filter(c => c.id !== id));
        }
    };

    const totalMonthly = clients.reduce((sum, client) => {
        return sum + calculateCommission(client).total;
    }, 0);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-gray-500">Chargement...</div>
            </div>
        );
    }

    return (
        <section className="min-h-screen pt-24 pb-12 bg-gray-50">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin/dashboard" className="p-2 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#0D7377]">
                                <CreditCard size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Facturation mensuelle</h1>
                                <p className="text-gray-500">Gestion des prélèvements clients</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="btn btn-primary"
                    >
                        <Plus size={20} />
                        Nouveau client
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-100">
                                <Building2 size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Clients actifs</p>
                                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-100">
                                <Calculator size={24} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Total mensuel</p>
                                <p className="text-2xl font-bold text-[#0D7377]">{totalMonthly} €</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-100">
                                <FileSpreadsheet size={24} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Prochain prélèvement</p>
                                <p className="text-2xl font-bold text-gray-900">1er du mois</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Client Form */}
                {showAddForm && (
                    <div className="card mb-8">
                        <h2 className="text-xl font-semibold mb-6 text-gray-900">Ajouter un client</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="label">Nom du restaurant *</label>
                                <input
                                    type="text"
                                    value={newClient.name}
                                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                    className="input"
                                    placeholder="Ex: Chez Zhang"
                                />
                            </div>
                            <div>
                                <label className="label">Email *</label>
                                <input
                                    type="email"
                                    value={newClient.email}
                                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                    className="input"
                                    placeholder="contact@restaurant.lu"
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="label mb-3">Services</label>
                            <div className="flex flex-wrap gap-4">
                                <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${newClient.hasHosting ? 'border-[#0D7377] bg-[#0D7377]/5' : 'border-gray-200'}`}>
                                    <input
                                        type="checkbox"
                                        checked={newClient.hasHosting}
                                        onChange={(e) => setNewClient({ ...newClient, hasHosting: e.target.checked })}
                                        className="w-5 h-5 rounded text-[#0D7377]"
                                    />
                                    <div>
                                        <span className="font-medium">Hébergement</span>
                                        <p className="text-sm text-gray-500">25€/mois</p>
                                    </div>
                                </label>

                                <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${newClient.hasOrderSystem ? 'border-[#0D7377] bg-[#0D7377]/5' : 'border-gray-200'}`}>
                                    <input
                                        type="checkbox"
                                        checked={newClient.hasOrderSystem}
                                        onChange={(e) => setNewClient({ ...newClient, hasOrderSystem: e.target.checked })}
                                        className="w-5 h-5 rounded text-[#0D7377]"
                                    />
                                    <div>
                                        <span className="font-medium">Système commande</span>
                                        <p className="text-sm text-gray-500">Commission variable</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Commission settings - only show if order system is selected */}
                        {newClient.hasOrderSystem && (
                            <div className="mt-6 p-4 bg-orange-50 rounded-xl">
                                <label className="label mb-3 text-orange-800">Paramètres commission</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-600 mb-1 block">Taux (%)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={newClient.commissionRate}
                                                onChange={(e) => setNewClient({ ...newClient, commissionRate: parseFloat(e.target.value) || 6 })}
                                                className="input w-20 text-center"
                                                min="1"
                                                max="20"
                                                step="0.5"
                                            />
                                            <span className="text-gray-500">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 mb-1 block">Minimum mensuel</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={newClient.minCommission}
                                                onChange={(e) => setNewClient({ ...newClient, minCommission: parseFloat(e.target.value) || 60 })}
                                                className="input w-20 text-center"
                                                min="0"
                                            />
                                            <span className="text-gray-500">€</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-orange-600 mt-2">
                                    Le client paiera {newClient.commissionRate}% du CA ou minimum {newClient.minCommission}€
                                </p>
                            </div>
                        )}

                        <div className="flex gap-4 mt-6">
                            <button onClick={addClient} className="btn btn-primary">
                                Ajouter le client
                            </button>
                            <button onClick={() => setShowAddForm(false)} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200">
                                Annuler
                            </button>
                        </div>
                    </div>
                )}

                {/* Clients Table */}
                <div className="card">
                    <h2 className="text-xl font-semibold mb-6 text-gray-900">Clients</h2>

                    {clients.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Building2 size={48} className="mx-auto mb-4 opacity-30" />
                            <p>Aucun client pour le moment</p>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="btn btn-primary mt-4"
                            >
                                <Plus size={20} />
                                Ajouter un client
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-4 px-2 font-medium text-gray-600">Restaurant</th>
                                        <th className="text-left py-4 px-2 font-medium text-gray-600">Services</th>
                                        <th className="text-left py-4 px-2 font-medium text-gray-600">CA mensuel</th>
                                        <th className="text-left py-4 px-2 font-medium text-gray-600">Détail</th>
                                        <th className="text-right py-4 px-2 font-medium text-gray-600">Total</th>
                                        <th className="py-4 px-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map((client) => {
                                        const commission = calculateCommission(client);
                                        return (
                                            <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-4 px-2">
                                                    <div className="font-medium text-gray-900">{client.name}</div>
                                                    <div className="text-sm text-gray-500">{client.email}</div>
                                                </td>
                                                <td className="py-4 px-2">
                                                    <div className="flex flex-wrap gap-1">
                                                        {client.hasHosting && (
                                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Hébergement</span>
                                                        )}
                                                        {client.hasOrderSystem && (
                                                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Commande</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2">
                                                    {client.hasOrderSystem ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                value={client.monthlyRevenue}
                                                                onChange={(e) => updateRevenue(client.id, parseFloat(e.target.value) || 0)}
                                                                className="input w-24 text-right py-1"
                                                                placeholder="0"
                                                            />
                                                            <span className="text-gray-500">€</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-2">
                                                    <div className="text-sm text-gray-600">
                                                        {commission.details.map((d, i) => (
                                                            <div key={i}>{d}</div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2 text-right">
                                                    <span className="text-xl font-bold text-[#0D7377]">{commission.total} €</span>
                                                </td>
                                                <td className="py-4 px-2">
                                                    <button
                                                        onClick={() => removeClient(client.id)}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50">
                                        <td colSpan={4} className="py-4 px-2 font-semibold text-gray-900">
                                            Total à prélever
                                        </td>
                                        <td className="py-4 px-2 text-right">
                                            <span className="text-2xl font-bold text-[#0D7377]">{totalMonthly} €</span>
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {clients.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
                            <p className="text-sm text-gray-500">
                                💡 Intégration GoCardless à venir pour les prélèvements automatiques
                            </p>
                            <button className="btn btn-primary opacity-50 cursor-not-allowed" disabled>
                                <CreditCard size={20} />
                                Lancer les prélèvements
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
