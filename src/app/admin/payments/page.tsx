'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    CreditCard,
    MoreVertical,
    Plus,
    CheckCircle,
    AlertCircle,
    Euro,
    FileText,
    Loader2,
    X,
    Lock
} from 'lucide-react';
import { supabase } from '@/lib/db/supabase';

// Types
interface Client {
    id: string;
    company_name: string;
    contact_name: string;
    email: string;
    vat_number: string;
    address: string;
    city: string;
    postal_code: string;
    mandate_status: 'active' | 'pending' | 'none' | 'cancelled' | 'failed';
    mandate_id?: string;
}

export default function PaymentsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Payment Modal State
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Fetch clients and mandates
    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch ALL clients using custom supabase client
                const { data: clientsData, error } = await supabase.select<any>(
                    'clients',
                    'select=*&order=created_at.desc'
                );

                if (error) throw new Error(error.message);
                if (!clientsData) {
                    setClients([]);
                    setLoading(false);
                    return;
                }

                // Fetch mandates separately
                const { data: mandatesData } = await supabase.select<any>(
                    'gocardless_mandates',
                    'select=client_id,status,mandate_id'
                );

                // Transform data
                const formattedClients: Client[] = clientsData.map((client: any) => {
                    const activeMandate = mandatesData?.find(
                        (m: any) => m.client_id === client.id && (m.status === 'active' || m.status === 'pending')
                    );

                    return {
                        id: client.id,
                        company_name: client.company_name,
                        contact_name: client.contact_name,
                        email: client.email,
                        vat_number: client.vat_number || '',
                        address: client.address || '',
                        city: client.city || '',
                        postal_code: client.postal_code || '',
                        mandate_status: activeMandate ? activeMandate.status : 'none',
                        mandate_id: activeMandate?.mandate_id
                    };
                });

                setClients(formattedClients);
            } catch (err) {
                console.error('Error fetching clients:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'failed':
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Actif';
            case 'pending': return 'En attente';
            case 'failed': return 'Échoué';
            case 'cancelled': return 'Annulé';
            default: return 'Aucun mandat';
        }
    };

    const handleCreateMandate = async (clientId: string) => {
        try {
            const response = await fetch('/api/gocardless/create-mandate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: clientId,
                    // redirect_uri: window.location.origin + '/admin/payments' (Optional, use default currently)
                })
            });

            const data = await response.json();

            if (data.authorization_url) {
                // Open GoCardless Hosted Page
                window.open(data.authorization_url, '_blank');
            } else {
                alert(data.error || 'Erreur lors de la création du mandat');
            }
        } catch (err) {
            console.error(err);
            alert('Erreur réseau');
        }
    };

    const openChargeModal = (client: Client) => {
        setSelectedClient(client);
        setPaymentAmount('');
        setShowPaymentModal(true);
    };

    const handleChargeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || !paymentAmount) return;

        setIsProcessingPayment(true);

        // SECURITY: Generate Idempotency Key
        const idempotencyKey = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        try {
            const response = await fetch('/api/gocardless/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Idempotency-Key': idempotencyKey
                },
                body: JSON.stringify({
                    client_id: selectedClient.id,
                    amount: Number(paymentAmount),
                    description: `Prélèvement manuel - ${new Date().toLocaleDateString()}`
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Échec du paiement');
            }

            alert(`Paiement de ${paymentAmount}€ initié avec succès !`);
            setShowPaymentModal(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erreur inconnue');
            setIsProcessingPayment(false);
        }
    };

    const handleVerifyMandate = async (clientId: string) => {
        try {
            const response = await fetch(`/api/gocardless/verify-mandate?client_id=${clientId}`);
            const data = await response.json();

            if (data.success) {
                alert(`Statut mis à jour: ${data.status}`);
                // Refresh list
                window.location.reload();
            } else {
                alert(`Erreur: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Échec de la vérification');
        }
    };

    const filteredClients = clients.filter(client =>
        client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Prélèvements & Mandats</h1>
                        <p className="text-gray-500 mt-1">Gérez les mandats GoCardless et les encaissements</p>
                    </div>
                    {/* Add global create button if needed */}
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto p-8">
                {/* Search & Filters */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 p-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher un client, société, email..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Clients Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Société / Client</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Info Facturation</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Mandat SEPA</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-sm text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 size={20} className="animate-spin" />
                                                Chargement...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredClients.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            Aucun client trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{client.company_name}</div>
                                                <div className="text-gray-500 text-sm">{client.contact_name}</div>
                                                <div className="text-gray-400 text-xs mt-0.5">{client.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-700">{client.address}</div>
                                                <div className="text-sm text-gray-700">{client.postal_code} {client.city}</div>
                                                <div className="text-xs text-gray-500 mt-1 font-mono">{client.vat_number}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.mandate_status)}`}>
                                                    {getStatusLabel(client.mandate_status)}
                                                </span>
                                                {client.mandate_status === 'pending' && (
                                                    <button
                                                        onClick={() => handleVerifyMandate(client.id)}
                                                        className="ml-2 text-xs text-blue-600 hover:underline"
                                                    >
                                                        (Vérifier)
                                                    </button>
                                                )}
                                                {client.mandate_id && (
                                                    <div className="text-xs text-gray-400 mt-1 font-mono">
                                                        {client.mandate_id}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {client.mandate_status === 'active' ? (
                                                        <button
                                                            onClick={() => openChargeModal(client)}
                                                            className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors border border-gray-200 hover:border-blue-200 flex items-center gap-2 text-sm font-medium"
                                                        >
                                                            <Euro size={16} />
                                                            <span className="hidden xl:inline">Prélever</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleCreateMandate(client.id)}
                                                            className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-1"
                                                        >
                                                            <Plus size={16} />
                                                            Créer Mandat
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Payment Modal */}
            {showPaymentModal && selectedClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-lg text-gray-900">
                                Prélever {selectedClient.company_name}
                            </h3>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleChargeSubmit} className="p-6 space-y-4">
                            <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2">
                                <Lock size={16} className="text-blue-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-blue-700">
                                    Paiement sécurisé avec clé d'idempotence unique.
                                    Limite de transaction: 5000€.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Montant à prélever
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.50"
                                        max="5000"
                                        required
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0.00"
                                    />
                                    <Euro size={16} className="absolute right-3 top-2.5 text-gray-400" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProcessingPayment}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isProcessingPayment ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Traitement...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={16} />
                                            Confirmer
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
