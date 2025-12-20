import Link from 'next/link';
import { ArrowRight, ArrowLeft, Check, Car, Sparkles, Shield, Clock, MapPin, Star } from 'lucide-react';

const services = [
    {
        icon: Sparkles,
        title: 'Lavage complet',
        description: 'Nettoyage intérieur et extérieur minutieux.',
    },
    {
        icon: Shield,
        title: 'Protection céramique',
        description: 'Traitement longue durée pour protéger votre carrosserie.',
    },
    {
        icon: Car,
        title: 'Polissage',
        description: 'Élimination des micro-rayures et restauration de l\'éclat.',
    },
    {
        icon: Star,
        title: 'Rénovation cuir',
        description: 'Nettoyage et traitement des sièges en cuir.',
    },
    {
        icon: Clock,
        title: 'Service express',
        description: 'Prestations rapides pour les urgences.',
    },
    {
        icon: MapPin,
        title: 'À domicile',
        description: 'Nous venons chez vous ou à votre bureau.',
    },
];

const packages = [
    {
        name: 'Essentiel',
        description: 'Lavage intérieur/extérieur standard',
        features: [
            'Lavage extérieur à la main',
            'Nettoyage intérieur',
            'Aspiration tapis et sièges',
            'Nettoyage des vitres',
        ],
    },
    {
        name: 'Premium',
        description: 'Nettoyage approfondi complet',
        popular: true,
        features: [
            'Tout de Essentiel',
            'Shampoing sièges/tapis',
            'Nettoyage moteur',
            'Traitement plastiques',
            'Cire de protection',
        ],
    },
    {
        name: 'Détailing',
        description: 'Rénovation complète du véhicule',
        features: [
            'Tout de Premium',
            'Polissage carrosserie',
            'Traitement céramique',
            'Rénovation phares',
            'Traitement cuir',
            'Garantie 6 mois',
        ],
    },
];

export default function ExtraAcePage() {
    return (
        <>
            {/* Hero */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-black to-indigo-900/20" />
                <div className="absolute top-1/4 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="container mx-auto px-6 relative z-10">
                    <Link href="/services" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                        <ArrowLeft size={20} />
                        Retour aux services
                    </Link>

                    <div className="max-w-3xl">
                        <span className="inline-block px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 text-sm mb-6">
                            Détailing automobile
                        </span>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            <span className="text-blue-400">Extra-Ace</span>.com
                        </h1>
                        <p className="text-xl text-gray-400 mb-8">
                            Services de nettoyage et détailing automobile premium.
                            Redonnez à votre véhicule son éclat d&apos;origine avec nos traitements professionnels.
                        </p>
                        <Link href="/contact" className="btn btn-primary bg-gradient-to-r from-blue-500 to-indigo-500">
                            Prendre rendez-vous
                            <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Services */}
            <section className="section bg-black">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">
                            Nos <span className="text-blue-400">Prestations</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Des services professionnels pour prendre soin de votre véhicule.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service) => (
                            <div key={service.title} className="card group">
                                <div className="p-3 rounded-xl bg-blue-500/20 w-fit mb-4 group-hover:bg-blue-500/30 transition-colors">
                                    <service.icon size={24} className="text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{service.title}</h3>
                                <p className="text-gray-400">{service.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Packages */}
            <section className="section bg-charcoal">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">
                            Nos <span className="text-blue-400">Forfaits</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Choisissez le niveau de soin adapté à votre véhicule.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {packages.map((pkg) => (
                            <div
                                key={pkg.name}
                                className={`card relative ${pkg.popular ? 'border-blue-500/50 bg-gradient-to-b from-blue-500/10 to-transparent' : ''}`}
                            >
                                {pkg.popular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
                                        Populaire
                                    </span>
                                )}
                                <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                                <p className="text-gray-400 text-sm mb-6">{pkg.description}</p>
                                <ul className="space-y-3 mb-8">
                                    {pkg.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3 text-gray-300">
                                            <Check size={18} className="text-blue-400 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/contact"
                                    className={`btn w-full ${pkg.popular ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' : 'btn-secondary border-blue-500 hover:bg-blue-500'}`}
                                >
                                    Réserver
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section bg-gradient-to-br from-blue-900/30 to-indigo-900/30">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Votre voiture mérite le meilleur
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
                        Prenez rendez-vous dès maintenant pour une prestation sur mesure.
                    </p>
                    <Link href="/contact" className="btn btn-primary bg-gradient-to-r from-blue-500 to-indigo-500">
                        Prendre rendez-vous
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </section>
        </>
    );
}
