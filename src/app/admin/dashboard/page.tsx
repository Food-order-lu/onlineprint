'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FileText,
    FolderOpen,
    LogOut,
    Plus,
    Clock,
    User,
    TrendingUp,
    Globe
} from 'lucide-react';

interface UserSession {
    email: string;
    name: string;
    loggedInAt: string;
}

const recentQuotes = [
    { id: 1, client: 'Restaurant Le Gourmet', plan: 'Premium', amount: '2,450 €', status: 'Signé', date: '18/12/2024' },
    { id: 2, client: 'Pizzeria Napoli', plan: 'Vitrine', amount: '990 €', status: 'En attente', date: '17/12/2024' },
    { id: 3, client: 'Café Central', plan: 'Personnalisé', amount: '3,200 €', status: 'Brouillon', date: '16/12/2024' },
];

export default function AdminDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('rivego_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            router.push('/admin/login');
        }
        setLoading(false);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('rivego_user');
        router.push('/admin/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-gray-500">Chargement...</div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <section className="min-h-screen pt-24 pb-12 bg-gray-50">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 text-gray-900">
                            Bonjour, <span className="text-[#1A3A5C]">{user.name.split(' ')[0]}</span>
                        </h1>
                        <p className="text-gray-500">Bienvenue dans votre espace commercial WebVision</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm">
                            <User size={18} className="text-[#1A3A5C]" />
                            <span className="text-sm text-gray-600">{user.email}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="btn btn-secondary py-2 px-4 text-sm"
                        >
                            <LogOut size={18} />
                            Déconnexion
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-12">
                    <h2 className="text-xl font-semibold mb-6 text-gray-900">Actions rapides</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* New Quote - WebVision only */}
                        <Link href="/admin/quote" className="card group relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="p-4 rounded-xl bg-[#0D7377] shrink-0">
                                    <Plus size={28} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-[#0D7377] transition-colors">
                                        Nouveau devis WebVision
                                    </h3>
                                    <p className="text-gray-500">Créer un devis pour un site web</p>
                                </div>
                            </div>
                        </Link>

                        {/* Portfolio */}
                        <Link href="/admin/portfolio" className="card group relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="p-4 rounded-xl bg-[#7B2CBF] shrink-0">
                                    <FolderOpen size={28} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-[#7B2CBF] transition-colors">
                                        Portfolio WebVision
                                    </h3>
                                    <p className="text-gray-500">Voir les réalisations pour les clients</p>
                                </div>
                            </div>
                        </Link>

                        {/* Billing */}
                        <Link href="/admin/billing" className="card group relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="p-4 rounded-xl bg-[#E85D04] shrink-0">
                                    <Globe size={28} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-[#E85D04] transition-colors">
                                        Facturation mensuelle
                                    </h3>
                                    <p className="text-gray-500">Gérer les prélèvements clients</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-500 text-sm">Devis ce mois</span>
                            <TrendingUp size={18} className="text-[#0D7377]" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">12</p>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-500 text-sm">Montant total</span>
                            <FileText size={18} className="text-[#7B2CBF]" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">24,500 €</p>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-500 text-sm">Taux de conversion</span>
                            <Clock size={18} className="text-[#E85D04]" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">68%</p>
                    </div>
                </div>

                {/* Recent Quotes */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Devis WebVision récents</h2>
                        <Link href="/admin/quotes" className="text-[#0D7377] hover:text-[#0A5A5C] text-sm font-medium">
                            Voir tout →
                        </Link>
                    </div>

                    <div className="card overflow-hidden p-0">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left text-gray-500 text-sm font-medium px-6 py-4">Client</th>
                                    <th className="text-left text-gray-500 text-sm font-medium px-6 py-4">Formule</th>
                                    <th className="text-left text-gray-500 text-sm font-medium px-6 py-4">Montant</th>
                                    <th className="text-left text-gray-500 text-sm font-medium px-6 py-4">Statut</th>
                                    <th className="text-left text-gray-500 text-sm font-medium px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentQuotes.map((quote) => (
                                    <tr key={quote.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-900 font-medium">{quote.client}</td>
                                        <td className="px-6 py-4 text-gray-600">{quote.plan}</td>
                                        <td className="px-6 py-4 text-gray-600">{quote.amount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${quote.status === 'Signé'
                                                ? 'bg-green-100 text-green-700'
                                                : quote.status === 'En attente'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {quote.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{quote.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}
