'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Receipt, Loader2, Plus, Trash2, CheckCircle } from 'lucide-react';

interface Subscription {
    id: string;
    service_type: string;
    service_name: string | null;
    monthly_amount: number;
    status: string;
}

interface OneTimeCharge {
    id: string;
    description: string;
    amount: number;
    invoiced: boolean;
    created_at: string;
}

interface InvoiceItem {
    description: string;
    amount: number;
    vatRate: number; // VAT rate in percent
    source: 'subscription' | 'one_time' | 'manual';
    sourceId?: string;
}

interface Client {
    id: string;
    company_name: string;
    email: string;
    subscriptions: Subscription[];
    oneTimeCharges: OneTimeCharge[];
}

export default function CreateInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [success, setSuccess] = useState(false);
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [manualDescription, setManualDescription] = useState('');
    const [manualAmount, setManualAmount] = useState('');
    const [manualVat, setManualVat] = useState('17');

    useEffect(() => {
        fetchClient();
    }, [resolvedParams.id]);

    async function fetchClient() {
        try {
            const response = await fetch(`/api/clients/${resolvedParams.id}`);
            if (response.ok) {
                const data = await response.json();
                // API returns { client: {...} }
                const clientData = data.client || data;
                setClient(clientData);

                // Pre-populate with active subscriptions
                const subscriptionItems: InvoiceItem[] = (clientData.subscriptions || [])
                    .filter((sub: Subscription) => sub.status === 'active')
                    .map((sub: Subscription) => ({
                        description: sub.service_name || sub.service_type,
                        amount: sub.monthly_amount,
                        vatRate: 17,
                        source: 'subscription' as const,
                        sourceId: sub.id,
                    }));

                // Add uninvoiced one-time charges
                const chargeItems: InvoiceItem[] = (clientData.oneTimeCharges || [])
                    .filter((c: OneTimeCharge) => !c.invoiced)
                    .map((charge: OneTimeCharge) => ({
                        description: charge.description,
                        amount: charge.amount,
                        vatRate: 17,
                        source: 'one_time' as const,
                        sourceId: charge.id,
                    }));

                setItems([...subscriptionItems, ...chargeItems]);
            }
        } catch (error) {
            console.error('Failed to fetch client:', error);
        } finally {
            setLoading(false);
        }
    }

    function addManualItem() {
        if (!manualDescription.trim() || !manualAmount) return;
        setItems([...items, {
            description: manualDescription,
            amount: parseFloat(manualAmount),
            vatRate: parseFloat(manualVat) || 0,
            source: 'manual', // Fix: source matches literal type
        }]);
        setManualDescription('');
        setManualAmount('');
        setManualVat('17');
    }

    function removeItem(index: number) {
        setItems(items.filter((_, i) => i !== index));
    }

    async function createInvoice() {
        if (!client || items.length === 0) return;

        setCreating(true);
        try {
            const response = await fetch('/api/invoicing/create-client-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: client.id,
                    items: items,
                }),
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                const data = await response.json();
                alert(`Erreur: ${data.error}`);
            }
        } catch (error) {
            console.error('Failed to create invoice:', error);
            alert('Erreur lors de la création de la facture');
        } finally {
            setCreating(false);
        }
    }

    const total = items.reduce((sum, item) => sum + item.amount, 0);
    const tva = items.reduce((sum, item) => sum + (item.amount * (item.vatRate / 100)), 0);
    const totalTtc = total + tva;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-900 p-8">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-12">
                        <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
                        <h1 className="text-2xl font-bold text-white mb-4">Facture créée avec succès</h1>
                        <p className="text-gray-400 mb-8">
                            La facture a été créée et envoyée à Zoho Books.
                        </p>
                        <Link
                            href={`/admin/clients/${client?.id}`}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium"
                        >
                            <ArrowLeft size={18} />
                            Retour au profil client
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href={`/admin/clients/${client?.id}`}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Créer une facture</h1>
                        <p className="text-gray-400">{client?.company_name}</p>
                    </div>
                </div>

                {/* Invoice Items */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Receipt size={20} />
                        Lignes de facture
                    </h2>

                    <div className="space-y-3 mb-6">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                                <div>
                                    <p className="font-medium text-white">{item.description}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded ${item.source === 'subscription' ? 'bg-blue-500/20 text-blue-400' :
                                        item.source === 'one_time' ? 'bg-orange-500/20 text-orange-400' :
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {item.source === 'subscription' ? 'Abonnement' :
                                            item.source === 'one_time' ? 'Service ponctuel' : 'Manuel'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right mr-4">
                                        <div className="font-bold text-white">€{item.amount.toFixed(2)}</div>
                                        <div className="text-xs text-gray-400">TVA {item.vatRate}%</div>
                                    </div>
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {items.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                Aucune ligne de facture. Ajoutez des éléments ci-dessous.
                            </div>
                        )}
                    </div>

                    {/* Add manual item */}
                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-3">Ajouter une ligne manuelle</h3>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={manualDescription}
                                onChange={(e) => setManualDescription(e.target.value)}
                                placeholder="Description"
                                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                            />
                            <input
                                type="number"
                                value={manualAmount}
                                onChange={(e) => setManualAmount(e.target.value)}
                                placeholder="Montant €"
                                className="w-32 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                                step="0.01"
                                min="0"
                            />
                            <div className="flex items-center gap-2 bg-gray-700 border border-gray-600 rounded-lg px-3">
                                <span className="text-gray-400 text-sm">TVA</span>
                                <input
                                    type="number"
                                    value={manualVat}
                                    onChange={(e) => setManualVat(e.target.value)}
                                    className="w-12 bg-transparent text-white placeholder-gray-500 text-right focus:outline-none"
                                    step="1"
                                    min="0"
                                    max="100"
                                />
                                <span className="text-gray-400 text-sm">%</span>
                            </div>
                            <button
                                onClick={addManualItem}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Totals */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-gray-400">
                            <span>Sous-total HT</span>
                            <span>€{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>TVA (Total)</span>
                            <span>€{tva.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-gray-700">
                            <span>Total TTC</span>
                            <span>€{totalTtc.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Create Button */}
                <button
                    onClick={createInvoice}
                    disabled={creating || items.length === 0}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
                >
                    {creating ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Création en cours...
                        </>
                    ) : (
                        <>
                            <Receipt size={20} />
                            Créer la facture
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
