import Link from 'next/link'

export default function CGVPage() {
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
                <h1 className="mb-xl">Conditions Générales de Vente</h1>

                <div className="card mb-lg">
                    <h2 className="mb-md">1. Objet</h2>
                    <p className="text-secondary">
                        Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre PrintFlow Pro,
                        société spécialisée dans l'impression professionnelle, et toute personne physique ou morale souhaitant effectuer
                        un achat via notre plateforme en ligne.
                    </p>
                </div>

                <div className="card mb-lg">
                    <h2 className="mb-md">2. Commandes</h2>
                    <p className="text-secondary mb-sm">
                        <strong>2.1 Passation de commande :</strong> Toute commande implique l'acceptation sans réserve des présentes CGV.
                    </p>
                    <p className="text-secondary mb-sm">
                        <strong>2.2 Validation :</strong> La commande n'est définitive qu'après paiement intégral et validation des fichiers par nos équipes.
                    </p>
                    <p className="text-secondary">
                        <strong>2.3 Fichiers :</strong> Le client doit fournir des fichiers conformes aux spécifications techniques (PDF, CMYK, fonds perdus).
                        PrintFlow Pro se réserve le droit de refuser ou de demander la modification de fichiers non conformes.
                    </p>
                </div>

                <div className="card mb-lg">
                    <h2 className="mb-md">3. Prix et Paiement</h2>
                    <p className="text-secondary mb-sm">
                        <strong>3.1 Prix :</strong> Les prix sont indiqués en euros TTC. La TVA applicable est de 20% pour les clients français (B2C).
                    </p>
                    <p className="text-secondary mb-sm">
                        <strong>3.2 Moyens de paiement :</strong> Carte bancaire (Stripe), PayPal, virement bancaire.
                    </p>
                    <p className="text-secondary">
                        <strong>3.3 Facturation :</strong> Une facture est générée automatiquement et accessible dans l'espace client.
                    </p>
                </div>

                <div className="card mb-lg">
                    <h2 className="mb-md">4. Livraison</h2>
                    <p className="text-secondary mb-sm">
                        <strong>4.1 Délais :</strong> Les délais de livraison sont indiqués à titre indicatif lors de la configuration du produit.
                    </p>
                    <p className="text-secondary mb-sm">
                        <strong>4.2 Transporteur :</strong> Les commandes sont expédiées via GLS ou autres transporteurs selon disponibilité.
                    </p>
                    <p className="text-secondary">
                        <strong>4.3 Tracking :</strong> Un numéro de suivi est communiqué par email dès l'expédition.
                    </p>
                </div>

                <div className="card mb-lg">
                    <h2 className="mb-md">5. Droit de rétractation</h2>
                    <p className="text-secondary">
                        Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les
                        produits confectionnés selon les spécifications du consommateur ou nettement personnalisés. Les impressions étant
                        réalisées à la demande, aucun droit de rétractation n'est applicable.
                    </p>
                </div>

                <div className="card mb-lg">
                    <h2 className="mb-md">6. Garantie et Réclamations</h2>
                    <p className="text-secondary mb-sm">
                        <strong>6.1 Qualité :</strong> PrintFlow Pro s'engage à fournir des produits conformes aux standards de qualité professionnelle.
                    </p>
                    <p className="text-secondary">
                        <strong>6.2 Réclamations :</strong> Toute réclamation doit être formulée par email dans les 48h suivant la réception.
                        Des photos justificatives devront être fournies.
                    </p>
                </div>

                <div className="card mb-lg">
                    <h2 className="mb-md">7. Protection des données</h2>
                    <p className="text-secondary">
                        Conformément au RGPD, les données personnelles sont collectées pour le traitement des commandes et ne sont en aucun cas
                        transmises à des tiers. Consultez notre <Link href="/legal/privacy">politique de confidentialité</Link> pour plus d'informations.
                    </p>
                </div>

                <div className="card">
                    <h2 className="mb-md">8. Contact</h2>
                    <p className="text-secondary">
                        <strong>PrintFlow Pro</strong><br />
                        Email : contact@printflow-pro.com<br />
                        Téléphone : +33 1 23 45 67 89<br />
                        <br />
                        Date de mise à jour : Décembre 2025
                    </p>
                </div>
            </div>
        </div>
    )
}
