import Link from 'next/link'

export default function PrivacyPage() {
    return (
        <div>
            <header style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: 'var(--spacing-md) 0',
            }}>
                <div className="container flex items-center justify-between">
                    <Link href="/" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'white' }}>
                        ✨ PrintFlow Pro
                    </Link>
                    <Link href="/" style={{ color: 'white' }}>← Retour</Link>
                </div>
            </header>

            <div className="container py-xl" style={{ maxWidth: '800px' }}>
                <h1 className="mb-xl">Politique de Confidentialité</h1>

                <div className="card mb-lg">
                    <h2 className="mb-md">1. Collecte des données</h2>
                    <p className="text-secondary">
                        PrintFlow Pro collecte les données personnelles suivantes : nom, prénom, email, adresse de livraison et de facturation,
                        numéro de téléphone, numéro de TVA intracommunautaire (pour les professionnels).
                    </p>
                </div>

                <div className="card mb-lg">
                    <h2 className="mb-md">2. Utilisation des données</h2>
                    <p className="text-secondary">
                        Les données collectées sont utilisées pour le traitement et le suivi des commandes, la facturation, et la communication
                        relative aux commandes. Elles ne sont en aucun cas vendues ou transmises à des tiers à des fins commerciales.
                    </p>
                </div>

                <div className="card mb-lg">
                    <h2 className="mb-md">3. Durée de conservation</h2>
                    <p className="text-secondary">
                        Les données sont conservées pendant la durée nécessaire au traitement de la commande et selon les obligations légales
                        (10 ans pour les données comptables et fiscales).
                    </p>
                </div>

                <div className="card mb-lg">
                    <h2 className="mb-md">4. Droits des utilisateurs</h2>
                    <p className="text-secondary">
                        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation du traitement,
                        de portabilité et d'opposition. Pour exercer ces droits, contactez-nous à : contact@printflow-pro.com
                    </p>
                </div>

                <div className="card">
                    <h2 className="mb-md">5. Cookies</h2>
                    <p className="text-secondary">
                        Notre site utilise des cookies essentiels pour le fonctionnement de la plateforme (session, panier) et des cookies
                        analytiques (avec votre consentement) pour améliorer nos services. Consultez notre <Link href="/legal/cookies">politique cookies</Link>.
                    </p>
                </div>
            </div>
        </div>
    )
}
