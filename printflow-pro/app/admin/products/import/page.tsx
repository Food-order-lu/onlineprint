'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CSVImportPage() {
    const [file, setFile] = useState<File | null>(null)
    const [importing, setImporting] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleImport = async () => {
        if (!file) return

        setImporting(true)
        // Simulate import
        await new Promise(resolve => setTimeout(resolve, 2000))
        setResult({
            success: true,
            imported: 15,
            errors: 0,
        })
        setImporting(false)
    }

    return (
        <div>
            <header style={{ backgroundColor: 'var(--color-text)', color: 'white', padding: 'var(--spacing-md) 0' }}>
                <div className="container flex items-center justify-between">
                    <h2>⚙️ Admin Panel</h2>
                    <Link href="/admin/products" style={{ color: 'white' }}>← Retour aux produits</Link>
                </div>
            </header>

            <div className="container py-xl">
                <h1 className="mb-xl">Import CSV - Produits</h1>

                <div className="grid grid-2" style={{ gap: 'var(--spacing-2xl)' }}>
                    <div>
                        <div className="card mb-lg">
                            <h3 className="mb-md">1. Télécharger le template</h3>
                            <p className="text-secondary mb-md">
                                Téléchargez le fichier CSV template pour voir la structure requise
                            </p>
                            <a href="/samples/product-import-template.csv" download className="btn btn-secondary">
                                📥 Télécharger le template CSV
                            </a>
                        </div>

                        <div className="card mb-lg">
                            <h3 className="mb-md">2. Importer votre fichier</h3>
                            <div className="form-group">
                                <label className="label">Sélectionner un fichier CSV</label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="input"
                                />
                            </div>
                            {file && (
                                <div className="alert alert-info">
                                    Fichier sélectionné : <strong>{file.name}</strong>
                                </div>
                            )}
                            <button
                                onClick={handleImport}
                                disabled={!file || importing}
                                className="btn btn-primary"
                            >
                                {importing ? 'Import en cours...' : '🚀 Lancer l\'import'}
                            </button>
                        </div>

                        {result && (
                            <div className={`alert alert-${result.success ? 'success' : 'error'}`}>
                                <strong>✅ Import réussi !</strong><br />
                                {result.imported} produits/variantes importés<br />
                                {result.errors} erreurs
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h3 className="mb-md">Format du fichier CSV</h3>
                        <p className="text-sm text-secondary mb-md">
                            Le fichier CSV doit contenir les colonnes suivantes :
                        </p>
                        <div style={{ fontSize: 'var(--text-sm)', fontFamily: 'monospace', backgroundColor: 'var(--color-bg-secondary)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
                            <strong>Colonnes requises :</strong><br />
                            • category_slug<br />
                            • product_name<br />
                            • product_slug<br />
                            • sku<br />
                            • format<br />
                            • paper_weight<br />
                            • paper_type<br />
                            • print_sides (RECTO ou RECTO_VERSO)<br />
                            • finish (optionnel)<br />
                            • min_quantity<br />
                            • max_quantity<br />
                            • supplier_cost<br />
                            • margin_percent<br />
                        </div>

                        <div className="mt-lg">
                            <h4 className="mb-sm">Exemple de ligne :</h4>
                            <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'monospace', backgroundColor: 'var(--color-bg-secondary)', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                                cartes-visite,Cartes Premium,cartes-premium,CV-001,85x55mm,350g,Couché mat,RECTO,Pelliculage mat,100,249,7.20,55
                            </div>
                        </div>

                        <div className="mt-lg alert alert-warning">
                            <strong>⚠️ Note :</strong> L'import écrasera les produits existants avec le même SKU. Vérifiez bien votre fichier avant l'import.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
