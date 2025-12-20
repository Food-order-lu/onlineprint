import Link from 'next/link';
import { ArrowRight, ArrowLeft, Check, Globe, Palette, Search, Shield, Wrench, Gauge } from 'lucide-react';

const features = [
    {
        icon: Palette,
        title: 'Design sur mesure',
        description: 'Un design unique qui reflète votre identité de marque.',
    },
    {
        icon: Gauge,
        title: 'Performance',
        description: 'Sites ultra-rapides optimisés pour la conversion.',
    },
    {
        icon: Search,
        title: 'SEO optimisé',
        description: 'Visibilité maximale sur les moteurs de recherche.',
    },
    {
        icon: Shield,
        title: 'Sécurité',
        description: 'Hébergement sécurisé avec certificat SSL inclus.',
    },
    {
        icon: Wrench,
        title: 'Maintenance',
        description: 'Mises à jour et support technique inclus.',
    },
    {
        icon: Globe,
        title: 'Responsive',
        description: 'Parfaitement adapté à tous les écrans.',
    },
];

const categories = [
    {
        name: 'Restaurant Vitrine',
        description: 'Site de présentation élégant avec menu interactif',
        projects: ['Chez Zhang', 'Kohinoor'],
    },
    {
        name: 'Restaurant Personnalisé',
        description: 'Site complet avec commande en ligne intégrée',
        projects: ['Nizart Piazza', 'Restaurant Pepperoni', 'La Terrazza'],
    },
    {
        name: 'Commerce Premium',
        description: 'Site commercial avancé avec fonctionnalités complètes',
        projects: ['Mon Traiteur'],
    },
];

const plans = [
    {
        name: 'Vitrine',
        description: 'Site de présentation simple et efficace',
        price: 'Sur devis',
        features: [
            'Design moderne',
            'Jusqu\'à 5 pages',
            'Formulaire de contact',
            'Responsive mobile',
            'SEO de base',
        ],
    },
    {
        name: 'Premium',
        description: 'Site professionnel avec fonctionnalités avancées',
        price: 'Sur devis',
        popular: true,
        features: [
            'Design personnalisé',
            'Pages illimitées',
            'Fonctionnalités avancées',
            'Blog intégré',
            'SEO avancé',
            'Analytics',
        ],
    },
    {
        name: 'Personnalisé',
        description: 'Solution sur mesure selon vos besoins',
        price: 'Sur devis',
        features: [
            'Tout de Premium',
            'Développement sur mesure',
            'Intégrations API',
            'E-commerce',
            'Multi-langues',
            'Support prioritaire',
        ],
    },
];

export default function WebVisionPage() {
    return (
        <>
            {/* Hero */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-900/30 via-black to-cyan-900/20" />
                <div className="absolute top-1/4 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />

                <div className="container mx-auto px-6 relative z-10">
                    <Link href="/services" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                        <ArrowLeft size={20} />
                        Retour aux services
                    </Link>

                    <div className="max-w-3xl">
                        <span className="inline-block px-4 py-2 rounded-full bg-teal-500/20 text-teal-400 text-sm mb-6">
                            Création web
                        </span>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            <span className="text-teal-400">WebVision</span>.lu
                        </h1>
                        <p className="text-xl text-gray-400 mb-8">
                            Des sites web modernes et performants pour votre entreprise.
                            Du site vitrine au e-commerce complet, nous créons des expériences digitales uniques.
                        </p>
                        <Link href="/contact" className="btn btn-primary">
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
                            Pourquoi <span className="text-teal-400">WebVision</span> ?
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Une expertise reconnue pour créer des sites qui performent.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature) => (
                            <div key={feature.title} className="card group">
                                <div className="p-3 rounded-xl bg-teal-500/20 w-fit mb-4 group-hover:bg-teal-500/30 transition-colors">
                                    <feature.icon size={24} className="text-teal-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Portfolio Categories */}
            <section className="section bg-charcoal">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">
                            Nos <span className="text-teal-400">Réalisations</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Découvrez quelques-uns de nos projets récents.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {categories.map((category) => (
                            <div key={category.name} className="card">
                                <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                                <p className="text-gray-400 text-sm mb-4">{category.description}</p>
                                <ul className="space-y-2">
                                    {category.projects.map((project) => (
                                        <li key={project} className="flex items-center gap-2 text-teal-400">
                                            <Check size={16} />
                                            {project}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Plans */}
            <section className="section bg-black">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">
                            Nos <span className="text-teal-400">Formules</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Choisissez la solution adaptée à vos besoins.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`card relative ${plan.popular ? 'border-teal-500/50 bg-gradient-to-b from-teal-500/10 to-transparent' : ''}`}
                            >
                                {plan.popular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-teal-500 text-white text-sm font-medium rounded-full">
                                        Populaire
                                    </span>
                                )}
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                                <div className="text-3xl font-bold text-teal-400 mb-6">{plan.price}</div>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3 text-gray-300">
                                            <Check size={18} className="text-teal-400 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/contact"
                                    className={`btn w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                    Choisir
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section bg-gradient-to-br from-teal-900/30 to-cyan-900/30">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Prêt à créer votre site web ?
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
                        Discutons de votre projet et donnons vie à vos idées.
                    </p>
                    <Link href="/contact" className="btn btn-primary">
                        Démarrer un projet
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </section>
        </>
    );
}
