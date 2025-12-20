import Link from 'next/link';
import { ArrowRight, Utensils, Globe, Printer, Car, Check } from 'lucide-react';

const services = [
    {
        id: 'foodorder',
        name: 'FoodOrder.lu',
        tagline: 'Système de commande en ligne',
        description: 'Transformez votre restaurant avec un système de commande en ligne performant. Intégration sur votre site existant ou création d\'un nouveau site complet.',
        icon: Utensils,
        gradient: 'from-orange-500 to-red-500',
        features: [
            'Commande en ligne 24/7',
            'Gestion des menus en temps réel',
            'Notifications automatiques',
            'Paiement en ligne sécurisé',
            'Tableau de bord intuitif',
            'Support technique dédié',
        ],
        href: '/services/foodorder',
    },
    {
        id: 'webvision',
        name: 'WebVision.lu',
        tagline: 'Création de sites web',
        description: 'Des sites web modernes et performants pour votre entreprise. Du site vitrine au e-commerce, nous créons des expériences digitales uniques.',
        icon: Globe,
        gradient: 'from-teal-500 to-cyan-500',
        features: [
            'Design sur mesure',
            'Sites responsives',
            'Optimisation SEO',
            'Maintenance incluse',
            'Hébergement sécurisé',
            'Formation utilisateur',
        ],
        href: '/services/webvision',
    },
    {
        id: 'onlineprint',
        name: 'OnlinePrint.lu',
        tagline: 'Services d\'impression',
        description: 'Tous vos supports de communication imprimés. Qualité professionnelle et délais rapides pour vos cartes de visite, flyers, et plus.',
        icon: Printer,
        gradient: 'from-purple-500 to-pink-500',
        features: [
            'Cartes de visite',
            'Flyers & Brochures',
            'Affiches grand format',
            'Packaging personnalisé',
            'Goodies entreprise',
            'Livraison express',
        ],
        href: '/services/onlineprint',
    },
    {
        id: 'extra-ace',
        name: 'Extra-Ace.com',
        tagline: 'Nettoyage automobile',
        description: 'Services de nettoyage et détailing automobile premium. Redonnez à votre véhicule son éclat d\'origine avec nos traitements professionnels.',
        icon: Car,
        gradient: 'from-blue-500 to-indigo-500',
        features: [
            'Lavage intérieur/extérieur',
            'Polissage carrosserie',
            'Traitement céramique',
            'Rénovation cuir',
            'Nettoyage moteur',
            'Service à domicile',
        ],
        href: '/services/extra-ace',
    },
];

export default function ServicesPage() {
    return (
        <>
            {/* Hero */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-black to-charcoal" />
                <div className="absolute top-1/4 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        Nos <span className="gradient-text">Services</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Un groupe, plusieurs expertises. Découvrez nos différentes solutions
                        pour accompagner votre croissance digitale.
                    </p>
                </div>
            </section>

            {/* Services Grid */}
            <section className="section bg-black">
                <div className="container mx-auto px-6">
                    <div className="space-y-24">
                        {services.map((service, index) => (
                            <div
                                key={service.id}
                                className={`flex flex-col lg:flex-row gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                                    }`}
                            >
                                {/* Icon/Visual */}
                                <div className="flex-1 flex justify-center">
                                    <div className={`relative p-16 rounded-3xl bg-gradient-to-br ${service.gradient} opacity-90`}>
                                        <service.icon size={120} className="text-white" />
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <span className="text-sm uppercase tracking-widest text-gray-500 mb-2 block">
                                        {service.tagline}
                                    </span>
                                    <h2 className="text-4xl font-bold text-white mb-4">
                                        {service.name}
                                    </h2>
                                    <p className="text-gray-400 text-lg mb-8">
                                        {service.description}
                                    </p>

                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                                        {service.features.map((feature) => (
                                            <li key={feature} className="flex items-center gap-3 text-gray-300">
                                                <Check size={18} className="text-teal-400 shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link href={service.href} className="btn btn-primary">
                                        En savoir plus
                                        <ArrowRight size={20} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section bg-gradient-to-br from-teal-900/30 to-coral-900/30">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Un projet en tête ?
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
                        Discutons de vos besoins et trouvons ensemble la solution adaptée.
                    </p>
                    <Link href="/contact" className="btn btn-primary">
                        Nous contacter
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </section>
        </>
    );
}
