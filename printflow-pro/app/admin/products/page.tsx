import Link from 'next/link'

export default function AdminProductsPage() {
    return (
        <div>
            <header style={{ backgroundColor: 'var(--color-text)', color: 'white', padding: 'var(--spacing-md) 0' }}>
                <div className="container flex items-center justify-between">
                    <h2>⚙️ Admin Panel</h2>
                    <div className="flex gap-lg">
                        <Link href="/admin" style={{ color: 'white' }}>Dashboard</Link>
                        <Link href="/admin/orders" style={{ color: 'white' }}>Commandes</Link>
                    </div>
                </div>
            </header>

            <div className="container py-xl">
                <div className="flex items-center justify-between mb-xl">
                    <h1>Gestion des Produits</h1>
                    <div className="flex gap-md">
                        <Link href="/admin/products/import" className="btn btn-primary">
                            📥 Importer CSV
                        </Link>
                        <button className="btn btn-secondary">➕ Nouveau produit</button>
                    </div>
                </div>

                <div className="card">
                    <div className="alert alert-info">
                        <strong>📄 Import CSV</strong> Utilisez la page d'import CSV pour ajouter rapidement des produits avec leurs variantes et tarifs.
                    </div>

                    <div className="text-center py-2xl text-secondary">
                        Interface de gestion produits - Utilisez l'import CSV pour charger des produits
                    </div>
                </div>
            </div>
        </div>
    )
}
