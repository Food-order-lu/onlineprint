import Link from 'next/link';
import { ArrowRight, ArrowLeft, Check, FileText, Image, Package, Truck, Palette, Sparkles } from 'lucide-react';

const features = [
    {
        icon: FileText,
        title: 'Cartes de visite',
        description: 'Impression premium sur papier de qualité.',
    },
    {
        icon: Image,
        title: 'Flyers & Brochures',
        description: 'Supports marketing impactants.',
    },
    {
        icon: Package,
        title: 'Packaging',
        description: 'Emballages personnalisés pour vos produits.',
    },
    {
        icon: Palette,
        title: 'Création graphique',
        description: 'Design professionnel inclus sur demande.',
    },
    {
        icon: Truck,
        title: 'Livraison rapide',
        description: 'Expédition express au Luxembourg et alentours.',
    },
    {
        icon: Sparkles,
        title: 'Finitions premium',
        description: 'Vernis, dorure, découpe sur mesure.',
    },
];

const products = [
    'Cartes de visite',
    'Flyers A5/A6',
    'Brochures & Catalogues',
    'Affiches grand format',
    'Roll-ups & Kakemonos',
    'Autocollants & Stickers',
    'Goodies entreprise',
    'Packaging personnalisé',
    'Papeterie (en-têtes, enveloppes)',
    'Menus & Cartes restaurant',
];

export default function OnlinePrintPage() {
    return (
        <>
            {/* Hero */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-pink-900/20" />
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

                <div className="container mx-auto px-6 relative z-10">
                    <Link href="/services" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                        <ArrowLeft size={20} />
                        Retour aux services
                    </Link>

                    <div className="max-w-3xl">
                        <span className="inline-block px-4 py-2 rounded-full bg-purple-500/20 text-purple-400 text-sm mb-6">
                            Impression professionnelle
                        </span>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            <span className="text-purple-400">OnlinePrint</span>.lu
                        </h1>
                        <p className="text-xl text-gray-400 mb-8">
                            Tous vos supports de communication imprimés avec une qualité professionnelle.
                            Délais rapides et livraison au Luxembourg.
                        </p>
                        <div className="inline-block px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl mb-8">
                            <span className="text-purple-300">🚧 Site en cours de développement</span>
                        </div>
                        <div className="block">
                            <Link href="/contact" className="btn btn-primary bg-gradient-to-r from-purple-500 to-pink-500">
                                Demander un devis
                                <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="section bg-black">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">
                            Nos <span className="text-purple-400">Services</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            De la conception à la livraison, nous gérons tout pour vous.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature) => (
                            <div key={feature.title} className="card group">
                                <div className="p-3 rounded-xl bg-purple-500/20 w-fit mb-4 group-hover:bg-purple-500/30 transition-colors">
                                    <feature.icon size={24} className="text-purple-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Products */}
            <section className="section bg-charcoal">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">
                            Nos <span className="text-purple-400">Produits</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Une large gamme de produits pour tous vos besoins en communication.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {products.map((product) => (
                            <div
                                key={product}
                                className="p-4 bg-charcoal-light rounded-xl text-center hover:bg-purple-500/20 transition-colors border border-white/5"
                            >
                                <span className="text-gray-300">{product}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section bg-gradient-to-br from-purple-900/30 to-pink-900/30">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Besoin d&apos;un devis personnalisé ?
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
                        Contactez-nous avec les détails de votre projet pour recevoir une offre sur mesure.
                    </p>
                    <Link href="/contact" className="btn btn-primary bg-gradient-to-r from-purple-500 to-pink-500">
                        Demander un devis
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </section>
        </>
    );
}
