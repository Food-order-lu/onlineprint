import Link from 'next/link'

export default function HomePage() {
    return (
        <div>
            {/* Header */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                backgroundColor: '#2563eb',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
                <div className="container">
                    <nav style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: '4rem'
                    }}>
                        <Link href="/" style={{
                            fontSize: 'var(--text-xl)',
                            fontWeight: 'var(--font-bold)',
                            color: 'white',
                            textDecoration: 'none'
                        }}>
                            ✨ PrintFlow Pro
                        </Link>
                        <div style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
                            <Link href="/catalog" style={{ color: 'white', fontWeight: '500' }}>Catalogue</Link>
                            <Link href="/account" style={{ color: 'white', fontWeight: '500' }}>Mon Compte</Link>
                            <Link href="/admin" style={{ color: 'white', fontWeight: '500' }}>Admin</Link>
                            <Link href="/cart" className="btn btn-secondary btn-sm">
                                🛒 Panier
                            </Link>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section style={{
                background: 'linear-gradient(to right, #2563eb, #1e40af)',
                color: 'white',
                padding: '4rem 0',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h1 style={{
                        fontSize: 'var(--text-5xl)',
                        fontWeight: 'var(--font-bold)',
                        marginBottom: 'var(--spacing-lg)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        Impression professionnelle<br />à prix revendeur
                    </h1>
                    <p style={{
                        fontSize: 'var(--text-xl)',
                        marginBottom: 'var(--spacing-2xl)',
                        opacity: 0.95,
                        maxWidth: '600px',
                        margin: '0 auto var(--spacing-2xl)'
                    }}>
                        Configurez vos produits d'impression en ligne. Qualité premium, délais rapides, tarifs compétitifs.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/catalog" className="btn btn-lg" style={{
                            backgroundColor: 'white',
                            color: 'var(--color-primary)',
                        }}>
                            🎨 Configurer maintenant
                        </Link>
                        <Link href="/catalog" className="btn btn-lg btn-outline" style={{
                            borderColor: 'white',
                            color: 'white',
                        }}>
                            📋 Voir le catalogue
                        </Link>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-xl" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <div className="container">
                    <h2 className="text-center mb-2xl" style={{ fontSize: 'var(--text-3xl)' }}>
                        Nos Produits d'Impression
                    </h2>
                    <div className="grid grid-4">
                        {categories.map((category) => (
                            <Link href={`/catalog?category=${category.slug}`} key={category.slug}>
                                <div className="card" style={{
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{
                                        fontSize: '3rem',
                                        marginBottom: 'var(--spacing-md)'
                                    }}>
                                        {category.icon}
                                    </div>
                                    <h3 style={{
                                        fontSize: 'var(--text-lg)',
                                        marginBottom: 'var(--spacing-sm)',
                                        fontWeight: 'var(--font-semibold)'
                                    }}>
                                        {category.name}
                                    </h3>
                                    <p className="text-secondary text-sm">{category.description}</p>
                                    <p className="text-primary text-sm font-semibold mt-sm">
                                        À partir de {category.startingPrice}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Badges */}
            <section className="py-xl">
                <div className="container">
                    <div className="grid grid-4">
                        {trustBadges.map((badge, index) => (
                            <div key={index} className="card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)' }}>
                                    {badge.icon}
                                </div>
                                <h4 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--spacing-sm)' }}>
                                    {badge.title}
                                </h4>
                                <p className="text-secondary text-sm">{badge.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-xl" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <div className="container">
                    <h2 className="text-center mb-2xl" style={{ fontSize: 'var(--text-3xl)' }}>
                        Ils nous font confiance
                    </h2>
                    <div className="grid grid-3">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="card">
                                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <div style={{
                                        color: '#fbbf24',
                                        fontSize: 'var(--text-lg)',
                                        marginBottom: 'var(--spacing-sm)'
                                    }}>
                                        ⭐⭐⭐⭐⭐
                                    </div>
                                    <p style={{
                                        fontStyle: 'italic',
                                        marginBottom: 'var(--spacing-md)',
                                        color: 'var(--color-text-secondary)'
                                    }}>
                                        "{testimonial.text}"
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontWeight: 'var(--font-semibold)' }}>{testimonial.author}</p>
                                    <p className="text-sm text-secondary">{testimonial.company}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                background: 'linear-gradient(to right, #2563eb, #1e40af)',
                color: 'white',
                padding: '4rem 0',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h2 style={{
                        fontSize: 'var(--text-3xl)',
                        marginBottom: 'var(--spacing-lg)'
                    }}>
                        Prêt à commander vos impressions ?
                    </h2>
                    <p style={{
                        fontSize: 'var(--text-lg)',
                        marginBottom: 'var(--spacing-xl)',
                        opacity: 0.95
                    }}>
                        Configurez votre produit en quelques clics et recevez un devis instantané.
                    </p>
                    <Link href="/catalog" className="btn btn-lg" style={{
                        backgroundColor: 'white',
                        color: 'var(--color-primary)',
                    }}>
                        Commencer ma configuration
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                backgroundColor: 'var(--color-text)',
                color: 'white',
                padding: 'var(--spacing-2xl) 0'
            }}>
                <div className="container">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-xl)',
                        marginBottom: 'var(--spacing-xl)'
                    }}>
                        <div>
                            <h4 style={{ marginBottom: 'var(--spacing-md)' }}>PrintFlow Pro</h4>
                            <p style={{ fontSize: 'var(--text-sm)', opacity: 0.8 }}>
                                Votre partenaire impression professionnelle en ligne.
                            </p>
                        </div>
                        <div>
                            <h5 style={{ marginBottom: 'var(--spacing-md)' }}>Produits</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                <Link href="/catalog" style={{ color: 'white', opacity: 0.8, fontSize: 'var(--text-sm)' }}>
                                    Cartes de visite
                                </Link>
                                <Link href="/catalog" style={{ color: 'white', opacity: 0.8, fontSize: 'var(--text-sm)' }}>
                                    Flyers
                                </Link>
                                <Link href="/catalog" style={{ color: 'white', opacity: 0.8, fontSize: 'var(--text-sm)' }}>
                                    Affiches
                                </Link>
                            </div>
                        </div>
                        <div>
                            <h5 style={{ marginBottom: 'var(--spacing-md)' }}>Légal</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                <Link href="/legal/cgv" style={{ color: 'white', opacity: 0.8, fontSize: 'var(--text-sm)' }}>
                                    CGV
                                </Link>
                                <Link href="/legal/privacy" style={{ color: 'white', opacity: 0.8, fontSize: 'var(--text-sm)' }}>
                                    Confidentialité
                                </Link>
                                <Link href="/legal/mentions" style={{ color: 'white', opacity: 0.8, fontSize: 'var(--text-sm)' }}>
                                    Mentions légales
                                </Link>
                            </div>
                        </div>
                        <div>
                            <h5 style={{ marginBottom: 'var(--spacing-md)' }}>Contact</h5>
                            <p style={{ fontSize: 'var(--text-sm)', opacity: 0.8 }}>
                                Email: contact@printflow-pro.com<br />
                                Tél: +33 1 23 45 67 89
                            </p>
                        </div>
                    </div>
                    <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.2)',
                        paddingTop: 'var(--spacing-lg)',
                        textAlign: 'center',
                        fontSize: 'var(--text-sm)',
                        opacity: 0.7
                    }}>
                        © 2025 PrintFlow Pro. Tous droits réservés.
                    </div>
                </div>
            </footer>
        </div>
    )
}

const categories = [
    {
        name: 'Cartes de visite',
        slug: 'cartes-visite',
        icon: '💼',
        description: 'Format standard et premium',
        startingPrice: '12,90 €',
    },
    {
        name: 'Flyers',
        slug: 'flyers',
        icon: '📄',
        description: 'A6, A5, A4 et plus',
        startingPrice: '25,00 €',
    },
    {
        name: 'Affiches',
        slug: 'affiches',
        icon: '🖼️',
        description: 'Tous formats disponibles',
        startingPrice: '45,00 €',
    },
    {
        name: 'Dépliants',
        slug: 'depliants',
        icon: '📑',
        description: '2 à 3 volets',
        startingPrice: '35,00 €',
    },
    {
        name: 'Brochures',
        slug: 'brochures',
        icon: '📚',
        description: 'Reliure agrafée ou dos carré',
        startingPrice: '89,00 €',
    },
    {
        name: 'Stickers',
        slug: 'stickers',
        icon: '✨',
        description: 'Toutes formes et tailles',
        startingPrice: '19,90 €',
    },
    {
        name: 'Bâches',
        slug: 'baches',
        icon: '🎪',
        description: 'Impression grand format',
        startingPrice: '120,00 €',
    },
    {
        name: 'Packaging',
        slug: 'packaging',
        icon: '📦',
        description: 'Boîtes et emballages',
        startingPrice: '75,00 €',
    },
]

const trustBadges = [
    {
        icon: '🎯',
        title: 'Qualité Premium',
        description: 'Impression professionnelle haute résolution',
    },
    {
        icon: '⚡',
        title: 'Livraison Rapide',
        description: 'Délais express disponibles',
    },
    {
        icon: '🔒',
        title: 'Paiement Sécurisé',
        description: 'Transactions protégées SSL',
    },
    {
        icon: '💬',
        title: 'Support Réactif',
        description: 'Assistance par email et téléphone',
    },
]

const testimonials = [
    {
        text: 'Service impeccable, qualité d\'impression au top et livraison ultra rapide. Je recommande !',
        author: 'Sophie Martin',
        company: 'Agence Créative',
    },
    {
        text: 'Prix très compétitifs pour de la qualité professionnelle. Le configurateur en ligne est très pratique.',
        author: 'Jean Dupont',
        company: 'Startup Tech',
    },
    {
        text: 'Excellent rapport qualité-prix. Les finitions sont parfaites et le suivi de commande au top.',
        author: 'Marie Durand',
        company: 'E-commerce',
    },
]
