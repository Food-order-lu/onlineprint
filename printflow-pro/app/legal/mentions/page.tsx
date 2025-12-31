import Link from 'next/link'

export default function MentionsPage() {
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
                <h1 className="mb-xl">Mentions Légales</h1>

                <div className="card mb-lg">
                    <h2 className="mb-md">Éditeur du site</h2>
                    <p className="text-secondary">
                        <strong>PrintFlow Pro</strong><br />
                        Société par actions simplifiée<br />
                        Capital social : 10 000 €<br />
                        RCS Paris B 123 456 789<br />
                        SIRET : 123 456 789 00012<br />
                        TVA intracommunautaire : FR 12 123456789<br />
                        <br />
                        Siège social :<br />
                        123 Avenue de l'Impression<br />
                        75001 Paris, France<br />
                        <br />
                        Email : contact@printflow-pro.com<br />
                        Téléphone : +33 1 23 45 67 89
                    </p>
                </div>

                <div className="card mb-lg">
                    <h2 className="mb-md">Directeur de publication</h2>
                    <p className="text-secondary">
                        M. Jean Directeur<br />
                        Email : direction@printflow-pro.com
                    </p>
                </div>

                <div className="card mb-lg">
                    <h2 className="mb-md">Hébergement</h2>
                    <p className="text-secondary">
                        Ce site est hébergé par :<br />
                        <strong>Vercel Inc.</strong><br />
                        340 S Lemon Ave #4133<br />
                        Walnut, CA 91789, USA
                    </p>
                </div>

                <div className="card">
                    <h2 className="mb-md">Propriété intellectuelle</h2>
                    <p className="text-secondary">
                        L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété
                        intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et
                        les représentations iconographiques et photographiques.
                    </p>
                </div>
            </div>
        </div>
    )
}
