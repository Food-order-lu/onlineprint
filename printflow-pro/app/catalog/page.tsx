import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function CatalogPage() {
    const products = await prisma.product.findMany({
        where: { active: true },
        include: {
            category: true,
            variants: {
                where: { active: true },
                include: {
                    pricingTiers: {
                        orderBy: { minQuantity: 'asc' },
                        take: 1,
                    },
                },
                take: 1,
            },
        },
        orderBy: { sortOrder: 'asc' },
    })

    return (
        <div>
            {/* Simple Header */}
            <header style={{
                backgroundColor: '#2563eb',
                padding: 'var(--spacing-md) 0',
            }}>
                <div className="container flex items-center justify-between">
                    <Link href="/" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'white' }}>
                        ✨ PrintFlow Pro
                    </Link>
                    <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
                        <Link href="/catalog" style={{ color: 'white' }}>Catalogue</Link>
                        <Link href="/account" style={{ color: 'white' }}>Compte</Link>
                        <Link href="/admin" style={{ color: 'white' }}>Admin</Link>
                    </div>
                </div>
            </header>

            <div className="container py-xl">
                <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                    <h1 className="mb-md">Notre Catalogue</h1>
                    <p className="text-secondary">
                        Choisissez votre produit et configurez-le selon vos besoins
                    </p>
                </div>

                <div className="grid grid-3">
                    {products.map((product) => {
                        const lowestPrice = product.variants[0]?.pricingTiers[0]?.sellingPrice ||
                            product.variants[0]?.baseCost * 1.4 || 0

                        return (
                            <Link href={`/products/${product.slug}`} key={product.id}>
                                <div className="card" style={{ height: '100%', cursor: 'pointer' }}>
                                    <div style={{
                                        height: '150px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        borderRadius: 'var(--radius-lg)',
                                        marginBottom: 'var(--spacing-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '3rem'
                                    }}>
                                        📄
                                    </div>
                                    <span className="badge badge-primary" style={{ marginBottom: 'var(--spacing-sm)' }}>
                                        {product.category.name}
                                    </span>
                                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>{product.name}</h3>
                                    <p className="text-secondary text-sm" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        {product.description}
                                    </p>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginTop: 'auto',
                                        paddingTop: 'var(--spacing-md)',
                                        borderTop: '1px solid var(--color-border)'
                                    }}>
                                        <span className="text-sm text-secondary">À partir de</span>
                                        <span className="text-xl font-bold text-primary">
                                            {lowestPrice.toFixed(2)} €
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {products.length === 0 && (
                    <div className="card text-center py-2xl">
                        <p className="text-secondary">Aucun produit disponible pour le moment.</p>
                        <Link href="/" className="btn btn-primary mt-md">
                            Retour à l'accueil
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
