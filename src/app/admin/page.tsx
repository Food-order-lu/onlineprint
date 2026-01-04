// Admin Home Page (Menu Principal)
// Path: /admin/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    FileText,
    CheckSquare,
    Settings,
    LogOut,
    CreditCard,
    Briefcase,
    LayoutDashboard,
    Loader2
} from 'lucide-react';

interface Stats {
    total_clients: number;
    active_clients: number;
    pending_cancellations: number;
    monthly_recurring_revenue: number;
    open_tasks: number;
}

export default function AdminHomePage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const menuItems = [
        {
            title: 'Commercial',
            description: 'Créer des devis, gérer les prospects',
            icon: Briefcase,
            color: 'bg-blue-500',
            href: '/admin/quote',
            count: null
        },
        {
            title: 'Gestion Clients',
            description: `${stats?.active_clients || 0} Clients actifs sur ${stats?.total_clients || 0} total`,
            icon: Users,
            color: 'bg-green-500',
            href: '/admin/clients',
            count: stats ? `${stats.active_clients} Actifs` : '...'
        },
        {
            title: 'Prélèvements',
            description: `MRR estimé : €${stats?.monthly_recurring_revenue.toFixed(2) || '0.00'}`,
            icon: CreditCard,
            color: 'bg-purple-500',
            href: '/admin/payments',
            count: null
        },
        {
            title: 'Tâches & Projets',
            description: `${stats?.open_tasks || 0} tâches en attente`,
            icon: CheckSquare,
            color: 'bg-orange-500',
            href: '/admin/tasks',
            count: stats ? `${stats.open_tasks}` : '...'
        },
        {
            title: 'Dashboard Global',
            description: 'Vue d\'ensemble et statistiques',
            icon: LayoutDashboard,
            color: 'bg-indigo-500',
            href: '/admin/dashboard',
            count: null
        },
        {
            title: 'Rapports & Com.',
            description: 'Suivi CA GloriaFood et facturation',
            icon: FileText,
            color: 'bg-teal-500',
            href: '/admin/reports',
            count: null
        }
    ];

    return (
        <div className="min-h-screen bg-white"> {/* Fond blanc demandé */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenue</h1>
                <p className="text-gray-500 mb-12">Sélectionnez un module pour commencer.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item) => (
                        <Link
                            key={item.title}
                            href={item.href}
                            className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-200 p-8 flex flex-col h-64"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 ${item.color} bg-opacity-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                                    <item.icon className={`w-7 h-7 text-${item.color.replace('bg-', '')}`} />
                                </div>
                                {item.count && (
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${item.color} bg-opacity-10 text-${item.color.replace('bg-', '')}-600`}>
                                        {item.count}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                {item.title}
                            </h3>

                            <p className="text-gray-500 leading-relaxed text-sm">
                                {loading ? 'Chargement...' : item.description}
                            </p>

                            <div className="absolute bottom-8 right-8 text-gray-300 group-hover:text-blue-500 transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}

