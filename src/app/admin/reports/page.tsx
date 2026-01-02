'use client';

import { useState, useEffect } from 'react';
import {
    FileText,
    RefreshCw,
    Upload,
    Check,
    AlertCircle,
    ArrowUpRight,
    UserPlus,
    Link as LinkIcon,
    X,
    Loader2
} from 'lucide-react';

// Mock types until we connect to DB
interface Report {
    id: string;
    client_name: string;
    client_id?: string; // If matched
    month: string; // YYYY-MM
    turnover: number;
    average_order_value: number; // New metric
    commission_amount: number;
    commission_type: 'fixed' | 'percentage';
    status: 'pending_match' | 'ready' | 'invoiced'; // Updated statuses
    orders_count: number;
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('2025-12'); // Default to current month
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        // TODO: Fetch from API
        const mockReports: Report[] = [
            {
                id: '1',
                client_name: 'Chez Mario',
                client_id: 'client_123',
                month: '2025-12',
                turnover: 12500.00,
                average_order_value: 27.78,
                commission_amount: 875.00, // 7%
                commission_type: 'percentage',
                status: 'ready',
                orders_count: 450
            },
            {
                id: '2',
                client_name: 'Sushi Zen',
                client_id: 'client_456',
                month: '2025-12',
                turnover: 850.00,
                average_order_value: 34.00,
                commission_amount: 60.00, // Fixed (< 1000)
                commission_type: 'fixed',
                status: 'ready',
                orders_count: 25
            },
            {
                id: '3',
                client_name: 'New Pizza Place', // Unmatched client
                month: '2025-12',
                turnover: 3200.00,
                average_order_value: 21.33,
                commission_amount: 0, // Not calculated yet
                commission_type: 'percentage',
                status: 'pending_match',
                orders_count: 150
            },
            {
                id: '4',
                client_name: 'Burger King',
                client_id: 'client_789',
                month: '2025-12',
                turnover: 45000.00,
                average_order_value: 37.50,
                commission_amount: 3150.00,
                commission_type: 'percentage',
                status: 'invoiced',
                orders_count: 1200
            }
        ];
        setReports(mockReports);
        setLoading(false);
    }, []);

    const handleImportEmails = () => {
        alert('Simulation: Connexion à la boîte mail reports@rivego.lu...\nParsing de 15 emails GloriaFood...');
        // Logic to trigger API call to parse emails
    };

    const handleGenerateInvoice = (reportId: string) => {
        const report = reports.find(r => r.id === reportId);
        if (report) {
            setSelectedReport(report);
            setShowInvoiceModal(true);
        }
    };

    const confirmInvoiceGeneration = async () => {
        if (!selectedReport) return;
        setIsGenerating(true);

        try {
            const response = await fetch('/api/invoicing/create-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_id: selectedReport.id,
                    report_data: selectedReport
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(`Facture brouillon créée ! N° ${data.invoice_number}`);
                setShowInvoiceModal(false);
                // Update local status mock
                setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, status: 'invoiced' } : r));
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            alert(`Erreur: ${error instanceof Error ? error.message : 'Echec'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLinkClient = (reportId: string, clientName: string) => {
        alert(`Lier le rapport "${clientName}" à un client existant ou créer "en attente"`);
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Rapports & Commissions</h1>
                        <p className="text-gray-500 mt-1">Suivi du Chiffre d'Affaires GloriaFood</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleImportEmails}
                            className="bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
                        >
                            <RefreshCw size={18} />
                            Synchro Emails
                        </button>
                        <button className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm">
                            <Upload size={18} />
                            Import Manuel
                        </button>
                    </div>
                </div>

                {/* Month Selector */}
                <div className="flex items-center gap-4 mt-6">
                    <span className="text-sm font-medium text-gray-700">Période :</span>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    />
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto p-8">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-sm font-medium">CA Total (Clients)</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">61,550.00 €</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-sm font-medium">Commissions à facturer</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">4,085.00 €</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-sm font-medium">Panier Moyen Global</p>
                        <p className="text-3xl font-bold text-indigo-600 mt-2">29.15 €</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-sm font-medium">Rapports reçus</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">4 / 45</p>
                    </div>
                </div>

                {/* Reports Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Restaurant</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Chiffre d'Affaires</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Commandes</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Panier Moyen</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Commission</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Statut</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-sm text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-10">Chargement...</td></tr>
                                ) : (
                                    reports.map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{report.client_name}</div>
                                                {report.status === 'pending_match' && (
                                                    <div className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                                        <AlertCircle size={12} /> Client inconnu
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">{(report.turnover || 0).toLocaleString('fr-LU', { style: 'currency', currency: 'EUR' })}</td>
                                            <td className="px-6 py-4 text-gray-500">{report.orders_count}</td>
                                            <td className="px-6 py-4 font-medium text-indigo-600">
                                                {(report.average_order_value || 0).toLocaleString('fr-LU', { style: 'currency', currency: 'EUR' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                {report.status === 'pending_match' ? (
                                                    <span className="text-gray-400 text-sm italic">-</span>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-blue-600">{(report.commission_amount || 0).toLocaleString('fr-LU', { style: 'currency', currency: 'EUR' })}</span>
                                                        <span className="text-xs text-gray-400">
                                                            {report.commission_type === 'fixed' ? 'Fixe (60€)' : 'Pourcentage'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {report.status === 'invoiced' && (
                                                    <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium px-2 py-1 bg-green-50 rounded-full">
                                                        <Check size={14} /> Facturé
                                                    </span>
                                                )}
                                                {report.status === 'ready' && (
                                                    <span className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium px-2 py-1 bg-blue-50 rounded-full">
                                                        <ArrowUpRight size={14} /> Prêt
                                                    </span>
                                                )}
                                                {report.status === 'pending_match' && (
                                                    <span className="inline-flex items-center gap-1 text-orange-600 text-sm font-medium px-2 py-1 bg-orange-50 rounded-full">
                                                        <LinkIcon size={14} /> À lier
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {report.status === 'ready' && (
                                                    <button
                                                        onClick={() => handleGenerateInvoice(report.id)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-end gap-1 ml-auto"
                                                    >
                                                        <FileText size={16} />
                                                        Générer Facture
                                                    </button>
                                                )}
                                                {report.status === 'pending_match' && (
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            onClick={() => handleLinkClient(report.id, report.client_name)}
                                                            className="text-orange-600 hover:text-orange-800 font-medium text-sm flex items-center gap-1"
                                                        >
                                                            <LinkIcon size={16} /> Lier Client
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>


            {/* Invoice Confirmation Modal */}
            {
                showInvoiceModal && selectedReport && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-semibold text-lg text-gray-900">
                                    Valider la Facture
                                </h3>
                                <button
                                    onClick={() => setShowInvoiceModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Montant Commission</p>
                                    <p className="text-2xl font-bold text-blue-700">
                                        {selectedReport.commission_amount?.toLocaleString('fr-LU', { style: 'currency', currency: 'EUR' })}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Basé sur CA: {selectedReport.turnover?.toLocaleString('fr-LU', { style: 'currency', currency: 'EUR' })}
                                    </p>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Client:</span>
                                        <span className="font-medium text-gray-900">{selectedReport.client_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Période:</span>
                                        <span className="font-medium text-gray-900">{selectedReport.month}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Condition:</span>
                                        <span className="font-medium text-gray-900">15 Jours</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>TVA:</span>
                                        <span className="font-medium text-gray-900">17%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-4 flex gap-3">
                                <button
                                    onClick={() => setShowInvoiceModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmInvoiceGeneration}
                                    disabled={isGenerating}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Création...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            Confirmer
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
