import Link from 'next/link';
import { ArrowRight, ArrowLeft, Check, ShoppingCart, Bell, CreditCard, BarChart3, Smartphone, Clock } from 'lucide-react';

const features = [
    {
        icon: ShoppingCart,
        title: 'Commande en ligne',
        description: 'Vos clients commandent directement depuis votre site, 24h/24.',
    },
    {
        icon: Bell,
        title: 'Notifications',
        description: 'Alertes en temps réel pour chaque nouvelle commande.',
    },
    {
        icon: CreditCard,
        title: 'Paiement sécurisé',
        description: 'Intégration des principaux moyens de paiement.',
    },
    {
        icon: BarChart3,
        title: 'Tableau de bord',
        description: 'Suivez vos ventes et analysez vos performances.',
    },
    {
        icon: Smartphone,
        title: 'Mobile-first',
        description: 'Interface optimisée pour tous les appareils.',
    },
    {
        icon: Clock,
        title: 'Gestion horaires',
        description: 'Définissez vos créneaux de livraison et disponibilités.',
    },
];

const plans = [
    {
        name: 'Intégration',
        description: 'Pour les restaurants ayant déjà un site web',
        price: 'Sur devis',
        features: [
            'Widget de commande intégré',
            'Synchronisation avec votre site',
            'Formation équipe',
            'Support technique',
        ],
    },
    {
        name: 'Site Complet',
        description: 'Création de site + système de commande',
        price: 'Sur devis',
        popular: true,
        features: [
            'Site web sur mesure',
            'Système de commande intégré',
            'Menu digital interactif',
            'Formation complète',
            'Maintenance incluse',
        ],
    },
    {
        name: 'Premium',
        description: 'Solution complète multi-établissements',
        price: 'Sur devis',
        features: [
            'Multi-restaurants',
            'App mobile dédiée',
            'Analytics avancés',
            'API personnalisée',
            'Support prioritaire',
        ],
    },
];

export default function FoodOrderPage() {
    return (
        <>
            {/* Hero */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-900/30 via-black to-red-900/20" />
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />

                <div className="container mx-auto px-6 relative z-10">
                    <Link href="/services" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                        <ArrowLeft size={20} />
                        Retour aux services
                    </Link>

                    <div className="max-w-3xl">
                        <span className="inline-block px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 text-sm mb-6">
                            Commande en ligne
                        </span>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            <span className="text-orange-400">FoodOrder</span>.lu
                        </h1>
                        <p className="text-xl text-gray-400 mb-8">
                            Transformez votre restaurant avec un système de commande en ligne performant.
                            Intégration sur votre site existant ou création d&apos;un nouveau site complet.
                        </p>
                        <Link href="/contact" className="btn btn-primary bg-gradient-to-r from-orange-500 to-red-500">
                            Demander un devis
                            <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="section bg-black">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">
                            Fonctionnalités <span className="text-orange-400">clés</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Tout ce dont vous avez besoin pour gérer vos commandes en ligne efficacement.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature) => (
                            <div key={feature.title} className="card group">
                                <div className="p-3 rounded-xl bg-orange-500/20 w-fit mb-4 group-hover:bg-orange-500/30 transition-colors">
                                    <feature.icon size={24} className="text-orange-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Plans */}
            <section className="section bg-charcoal">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">
                            Nos <span className="text-orange-400">Formules</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Choisissez la solution adaptée à vos besoins.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`card relative ${plan.popular ? 'border-orange-500/50 bg-gradient-to-b from-orange-500/10 to-transparent' : ''}`}
                            >
                                {plan.popular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-500 text-white text-sm font-medium rounded-full">
                                        Populaire
                                    </span>
                                )}
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                                <div className="text-3xl font-bold text-orange-400 mb-6">{plan.price}</div>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3 text-gray-300">
                                            <Check size={18} className="text-orange-400 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/contact"
                                    className={`btn w-full ${plan.popular ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'btn-secondary border-orange-500 hover:bg-orange-500'}`}
                                >
                                    Choisir
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section bg-gradient-to-br from-orange-900/30 to-red-900/30">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Prêt à digitaliser votre restaurant ?
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
                        Contactez-nous pour une démonstration personnalisée de notre système.
                    </p>
                    <Link href="/contact" className="btn btn-primary bg-gradient-to-r from-orange-500 to-red-500">
                        Demander une démo
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </section>
        </>
    );
}
