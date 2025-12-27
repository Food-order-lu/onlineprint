// Admin Home Page (Menu Principal)
// Path: /admin/page.tsx

'use client';

import Link from 'next/link';
import {
    Users,
    FileText,
    CheckSquare,
    Settings,
    LogOut,
    CreditCard,
    Briefcase,
    LayoutDashboard
} from 'lucide-react';

export default function AdminHomePage() {
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
            description: 'Clients actifs, inactifs et abonnements',
            icon: Users,
            color: 'bg-green-500',
            href: '/admin/clients',
            count: 'dashboard-stats' // Will serve as a placeholder for real stats
        },
        {
            title: 'Prélèvements',
            description: 'Mandats SEPA et encaissements',
            icon: CreditCard,
            color: 'bg-purple-500',
            href: '/admin/payments', // We might need to create this or link to a filtered client list
            count: null
        },
        {
            title: 'Tâches & Projets',
            description: 'Suivi de production des sites web',
            icon: CheckSquare,
            color: 'bg-orange-500',
            href: '/admin/tasks',
            count: 'task-stats'
        },
        {
            title: 'Dashboard Global',
            description: 'Vue d\'ensemble et statistiques',
            icon: LayoutDashboard,
            color: 'bg-indigo-500',
            href: '/admin/dashboard',
            count: null
        },
    ];

    return (
        <div className="min-h-screen bg-white"> {/* Fond blanc demandé */}
            {/* Header */}
            <header className="bg-white border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">R</div>
                    <span className="font-bold text-xl text-gray-900">Rivego Admin</span>
                </div>
                <Link href="/admin/login" className="text-gray-500 hover:text-red-500 transition-colors">
                    <LogOut size={20} />
                </Link>
            </header>

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
                            <div className={`w-14 h-14 ${item.color} bg-opacity-10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}>
                                <item.icon className={`w-7 h-7 text-${item.color.replace('bg-', '')}`} />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                {item.title}
                            </h3>

                            <p className="text-gray-500 leading-relaxed">
                                {item.description}
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
