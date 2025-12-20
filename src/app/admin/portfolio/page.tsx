'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Globe, Utensils, ShoppingBag } from 'lucide-react';

const portfolioItems = [
    {
        id: 1,
        name: 'Nizart Piazza',
        category: 'Restaurant Personnalisé',
        description: 'Restaurant italien premium avec système de commande en ligne intégré.',
        image: '/portfolio/nizart.jpg',
        url: '#',
        features: ['Commande en ligne', 'Menu interactif', 'Réservation'],
    },
    {
        id: 2,
        name: 'Restaurant Pepperoni',
        category: 'Restaurant Personnalisé',
        description: 'Pizzeria avec menu dynamique et commande en ligne.',
        image: '/portfolio/pepperoni.jpg',
        url: '#',
        features: ['Menu du jour', 'Commande en ligne', 'Galerie photos'],
    },
    {
        id: 3,
        name: 'La Terrazza',
        category: 'Restaurant Personnalisé',
        description: 'Restaurant italien haut de gamme avec système de réservation.',
        image: '/portfolio/terrazza.jpg',
        url: '#',
        features: ['Réservation en ligne', 'Menu interactif', 'Events'],
    },
    {
        id: 4,
        name: 'Chez Zhang',
        category: 'Restaurant Vitrine',
        description: 'Restaurant asiatique avec menu interactif élégant.',
        image: '/portfolio/zhang.jpg',
        url: '#',
        features: ['Menu digital', 'Photos galerie', 'Contact'],
    },
    {
        id: 5,
        name: 'Kohinoor',
        category: 'Restaurant Vitrine',
        description: 'Restaurant indien et tibétain situé à Howald.',
        image: '/portfolio/kohinoor.jpg',
        url: '#',
        features: ['Menu digital', 'Horaires', 'Localisation'],
    },
    {
        id: 6,
        name: 'Mon Traiteur',
        category: 'Commerce Premium',
        description: 'Service traiteur avec galerie photo et formulaire de devis.',
        image: '/portfolio/traiteur.jpg',
        url: '#',
        features: ['Galerie photos', 'Formulaire devis', 'Prestations'],
    },
];

const categories = [
    { id: 'all', label: 'Tous les projets', icon: Globe },
    { id: 'Restaurant Vitrine', label: 'Restaurant Vitrine', icon: Utensils },
    { id: 'Restaurant Personnalisé', label: 'Restaurant Personnalisé', icon: Utensils },
    { id: 'Commerce Premium', label: 'Commerce Premium', icon: ShoppingBag },
];

export default function PortfolioPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const user = localStorage.getItem('rivego_user');
        if (!user) {
            router.push('/admin/login');
        }
        setLoading(false);
    }, [router]);

    const filteredItems = filter === 'all'
        ? portfolioItems
        : portfolioItems.filter(item => item.category === filter);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Chargement...</div>
            </div>
        );
    }

    return (
        <section className="min-h-screen pt-24 pb-12">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/admin/dashboard"
                        className="p-2 rounded-xl bg-charcoal hover:bg-charcoal-light transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">
                            Portfolio <span className="gradient-text">WebVision</span>
                        </h1>
                        <p className="text-gray-400">Montrez nos réalisations à vos clients</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-8">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setFilter(cat.id)}
                            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${filter === cat.id
                                    ? 'bg-teal-500 text-white'
                                    : 'bg-charcoal text-gray-300 hover:bg-charcoal-light'
                                }`}
                        >
                            <cat.icon size={18} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="card group overflow-hidden p-0">
                            {/* Image placeholder */}
                            <div className="h-48 bg-gradient-to-br from-charcoal-light to-charcoal flex items-center justify-center">
                                <Globe size={48} className="text-gray-600" />
                            </div>

                            <div className="p-6">
                                <span className="text-xs text-teal-400 uppercase tracking-wider">
                                    {item.category}
                                </span>
                                <h3 className="text-xl font-bold text-white mt-1 mb-2 group-hover:text-teal-400 transition-colors">
                                    {item.name}
                                </h3>
                                <p className="text-gray-400 text-sm mb-4">{item.description}</p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {item.features.map((feature) => (
                                        <span
                                            key={feature}
                                            className="px-2 py-1 bg-charcoal-light text-gray-300 text-xs rounded"
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>

                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm"
                                >
                                    Voir le site
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredItems.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400">Aucun projet dans cette catégorie</p>
                    </div>
                )}
            </div>
        </section>
    );
}
