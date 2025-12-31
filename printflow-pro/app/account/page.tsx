import Link from 'next/link'

export default function CustomerAccountPage() {
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
                    <Link href="/catalog" style={{ color: 'white' }}>← Retour au catalogue</Link>
                </div>
            </header>

            <div className="container py-xl">
                <h1 className="mb-xl">Mon Compte</h1>

                <div className="grid grid-3 mb-2xl">
                    <Link href="/account/orders">
                        <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📦</div>
                            <h3 className="mb-sm">Mes Commandes</h3>
                            <p className="text-secondary text-sm">Voir l'historique et le suivi</p>
                        </div>
                    </Link>

                    <Link href="/account/profile">
                        <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>👤</div>
                            <h3 className="mb-sm">Mon Profil</h3>
                            <p className="text-secondary text-sm">Informations personnelles</p>
                        </div>
                    </Link>

                    <Link href="/account/addresses">
                        <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📍</div>
                            <h3 className="mb-sm">Mes Adresses</h3>
                            <p className="text-secondary text-sm">Gérer mes adresses</p>
                        </div>
                    </Link>
                </div>

                <div className="card">
                    <h3 className="mb-md">Informations de connexion</h3>
                    <div className="flex items-center justify-between mb-md">
                        <div>
                            <div className="font-semibold mb-xs">Email</div>
                            <div className="text-secondary">client@example.com</div>
                        </div>
                    </div>
                    <button className="btn btn-secondary">Modifier le mot de passe</button>
                </div>
            </div>
        </div>
    )
}
