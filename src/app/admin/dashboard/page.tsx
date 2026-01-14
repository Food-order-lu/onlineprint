// Redesigned Admin Dashboard (White Theme + Segmentation)
// Path: /admin/dashboard/page.tsx

'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Activity,
    Archive,
    UserPlus,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle,
    Target
} from 'lucide-react';

export default function DashboardGlobalPage() {
    // const [showObjectives, setShowObjectives] = useState(false); -> removed
    const [stats, setStats] = useState({
        activeClients: 0,
        inactiveClients: 0,
        prospects: 0,
        mrr: 0, // Monthly Recurring Revenue
        fixedRevenue: 0,
        pendingTasks: 0,
        recentActivity: [] as any[],
        signedQuotesThisMonth: 0,
        newClientsThisMonth: 0,
        newMRRThisMonth: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/admin/stats');
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Progress calculations
    // Progress calculations (Monthly Goals)
    const clientProgress = (stats.newClientsThisMonth / 5) * 100; // Target: 5 new clients/month
    const mrrProgress = (stats.newMRRThisMonth / 500) * 100; // Target: 500€ new MRR/month
    const fixedRevenueProgress = (stats.fixedRevenue / 5000) * 100; // Target: 5000€ fixed/month

    return (
        <div className="min-h-screen bg-white p-6 md:p-12">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Global</h1>
                {/* 
{/* 
                <button
                    onClick={() => setShowObjectives(!showObjectives)}
                    className={`p-2 rounded-xl transition-colors ${showObjectives ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}
                    title="Mode Direction"
                >
                    <ArrowUpRight size={20} />
                </button> 
                */}
            </div>

            {/* Commercial Objectives Section */}
            <div className="mb-12 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-yellow-50 rounded-lg">
                            <Target size={24} className="text-yellow-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Objectifs Commerciaux</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Nouveaux Clients</p>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold text-gray-900">{stats.newClientsThisMonth}</span>
                                <span className="text-gray-400 mb-1">/ 5</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(clientProgress, 100)}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <p className="text-gray-500 text-sm mb-1">Nouveau MRR</p>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold text-gray-900">{(stats.newMRRThisMonth).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€</span>
                                <span className="text-gray-400 mb-1">/ 500€</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(mrrProgress, 100)}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <p className="text-gray-500 text-sm mb-1">Objectif Mensuel (Services Fixes)</p>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold text-gray-900">{(stats.fixedRevenue).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€</span>
                                <span className="text-gray-400 mb-1">/ 5 000€</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(fixedRevenueProgress, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {/* Active Clients */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <Activity size={24} />
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+2 ce mois</span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Clients Actifs</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.activeClients}</h3>
                </div>

                {/* Inactive Clients (Anciens) */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gray-50 rounded-xl text-gray-500">
                            <Archive size={24} />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Anciens Clients</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.inactiveClients}</h3>
                </div>

                {/* Prospects */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-500">
                            <UserPlus size={24} />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Prospects (Devis)</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.prospects}</h3>
                </div>

                {/* MRR */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                            <span className="font-bold text-xl">€</span>
                        </div>
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">+5%</span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Revenu Mensuel (MRR)</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.mrr.toLocaleString()} €</h3>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Activité Récente</h2>
                    <div className="space-y-6">
                        {stats.recentActivity.map((item) => (
                            <div key={item.id} className="flex items-start gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                                <div className={`mt-1 w-2 h-2 rounded-full ${item.type === 'sign' ? 'bg-green-500' :
                                    item.type === 'payment' ? 'bg-blue-500' : 'bg-orange-500'
                                    }`} />
                                <div>
                                    <p className="text-gray-900 font-medium">{item.text}</p>
                                    <p className="text-gray-400 text-xs mt-1">{item.time}</p>
                                </div>
                            </div>
                        ))}
                        {loading && <p className="text-gray-400">Chargement...</p>}
                    </div>
                </div>

                {/* Quick Tasks Overview */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Tâches en attente</h2>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full border-4 border-orange-100 flex items-center justify-center">
                            <span className="text-xl font-bold text-orange-500">{stats.pendingTasks}</span>
                        </div>
                        <div>
                            <p className="text-gray-900 font-medium">Tâches actives</p>
                            <p className="text-gray-500 text-sm">Priorité haute: 3</p>
                        </div>
                    </div>

                    <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors">
                        Voir toutes les tâches
                    </button>
                </div>

            </div>
        </div>
    );
}
