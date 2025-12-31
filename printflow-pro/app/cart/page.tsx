import Link from 'next/link'

export default function CartPage() {
    // In production, would fetch cart from API/session
    const cartItems: any[] = []

    return (
        <div>
            <header style={{
                backgroundColor: '#2563eb',
                padding: 'var(--spacing-md) 0',
            }}>
                <div className="container flex items-center justify-between">
                    <Link href="/" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'white' }}>
                        ✨ PrintFlow Pro
                    </Link>
                    <Link href="/catalog" style={{ color: 'white' }}>← Continuer mes achats</Link>
                </div>
            </header>

            <div className="container py-xl">
                <h1 className="mb-xl">Mon Panier</h1>

                {cartItems.length === 0 ? (
                    <div className="card text-center py-2xl">
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-lg)' }}>🛒</div>
                        <h2 className="mb-md">Votre panier est vide</h2>
                        <p className="text-secondary mb-xl">
                            Ajoutez des produits depuis notre catalogue pour commencer votre commande
                        </p>
                        <Link href="/catalog" className="btn btn-primary">
                            Découvrir nos produits
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-2" style={{ gap: 'var(--spacing-2xl)', alignItems: 'start' }}>
                        <div>
                            {/* Cart items would go here */}
                            <div className="card mb-md">
                                <div className="flex items-center justify-between mb-md">
                                    <div>
                                        <h3 className="mb-xs">Cartes de Visite Premium</h3>
                                        <p className="text-sm text-secondary">
                                            85x55mm • 350g • Recto-Verso • Pelliculage mat
                                        </p>
                                    </div>
                                    <button className="btn btn-sm btn-secondary">✕</button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm text-secondary">Quantité :</span>&nbsp;
                                        <select className="select" style={{ width: 'auto', display: 'inline-block' }}>
                                            <option>250</option>
                                            <option>500</option>
                                            <option>1000</option>
                                        </select>
                                    </div>
                                    <div className="text-xl font-bold text-primary">50,00 €</div>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ position: 'sticky', top: 'var(--spacing-lg)' }}>
                            <h3 className="mb-lg">Récapitulatif</h3>
                            <div className="flex justify-between mb-sm">
                                <span className="text-secondary">Sous-total HT</span>
                                <span className="font-semibold">41,67 €</span>
                            </div>
                            <div className="flex justify-between mb-sm">
                                <span className="text-secondary">TVA (20%)</span>
                                <span>8,33 €</span>
                            </div>
                            <div className="flex justify-between mb-sm">
                                <span className="text-secondary">Livraison</span>
                                <span className="text-success font-semibold">Offerte</span>
                            </div>
                            <div style={{
                                borderTop: '1px solid var(--color-border)',
                                paddingTop: 'var(--spacing-md)',
                                marginTop: 'var(--spacing-md)'
                            }}>
                                <div className="flex justify-between items-center mb-md">
                                    <span className="font-bold">Total TTC</span>
                                    <span className="text-3xl font-bold text-primary">50,00 €</span>
                                </div>
                            </div>
                            <Link href="/checkout" className="btn btn-primary" style={{ width: '100%' }}>
                                Passer la commande →
                            </Link>
                            <div className="text-center text-xs text-secondary mt-md">
                                🔒 Paiement 100% sécurisé
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
