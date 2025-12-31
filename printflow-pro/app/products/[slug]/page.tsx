'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Product {
    id: string
    name: string
    slug: string
    description: string
}

interface Variant {
    id: string
    sku: string
    format: string
    paperWeight: string
    paperType: string
    printSides: string
    finish: string | null
}

interface PricingTier {
    id: string
    minQuantity: number
    maxQuantity: number | null
}

export default function ProductConfiguratorPage({ params }: { params: { slug: string } }) {
    const [product, setProduct] = useState<Product | null>(null)
    const [variants, setVariants] = useState<Variant[]>([])
    const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])

    const [step, setStep] = useState(1)
    const [quantity, setQuantity] = useState(250)
    const [selectedFormat, setSelectedFormat] = useState('')
    const [selectedPaper, setSelectedPaper] = useState('')
    const [selectedSides, setSelectedSides] = useState('RECTO')
    const [selectedFinish, setSelectedFinish] = useState('')
    const [price, setPrice] = useState(0)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // Fetch product data
        fetch(`/api/products/${params.slug}`)
            .then(res => res.json())
            .then(data => {
                setProduct(data.product)
                setVariants(data.variants)
                setPricingTiers(data.pricingTiers)
            })
            .catch(err => console.error(err))
    }, [params.slug])

    useEffect(() => {
        // Calculate price when configuration changes
        if (selectedFormat && selectedPaper) {
            calculatePrice()
        }
    }, [quantity, selectedFormat, selectedPaper, selectedSides, selectedFinish])

    const calculatePrice = async () => {
        const variant = variants.find(
            v => v.format === selectedFormat &&
                v.paperWeight === selectedPaper &&
                v.printSides === selectedSides
        )

        if (!variant) return

        const res = await fetch(`/api/products/${params.slug}/calculate-price`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                variantId: variant.id,
                quantity,
            }),
        })

        const data = await res.json()
        if (data.price) {
            setPrice(data.price.total)
        }
    }

    const addToCart = async () => {
        setLoading(true)
        // Implementation would add to cart
        await new Promise(resolve => setTimeout(resolve, 1000))
        alert('Produit ajouté au panier !')
        setLoading(false)
    }

    const formats = [...new Set(variants.map(v => v.format))]
    const papers = [...new Set(variants.map(v => v.paperWeight))]
    const quantities = pricingTiers.map(t => t.minQuantity)

    if (!product) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 'var(--spacing-2xl)' }}>
                    {/* Main Configurator */}
                    <div>
                        <h1 className="mb-md">{product.name}</h1>
                        <p className="text-secondary mb-xl">{product.description}</p>

                        {/* Step 1: Quantity */}
                        <div className="card mb-lg">
                            <div className="flex items-center justify-between mb-md">
                                <h3>1. Quantité</h3>
                                <span className="badge badge-primary">Étape {step}/4</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 'var(--spacing-sm)' }}>
                                {quantities.map(qty => (
                                    <button
                                        key={qty}
                                        onClick={() => setQuantity(qty)}
                                        className={quantity === qty ? 'btn btn-primary' : 'btn btn-secondary'}
                                    >
                                        {qty}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Format */}
                        <div className="card mb-lg">
                            <h3 className="mb-md">2. Format</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 'var(--spacing-sm)' }}>
                                {formats.map(format => (
                                    <button
                                        key={format}
                                        onClick={() => { setSelectedFormat(format); setStep(Math.max(step, 2)) }}
                                        className={selectedFormat === format ? 'btn btn-primary' : 'btn btn-secondary'}
                                    >
                                        {format}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 3: Paper */}
                        <div className="card mb-lg">
                            <h3 className="mb-md">3. Papier</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 'var(--spacing-sm)' }}>
                                {papers.map(paper => (
                                    <button
                                        key={paper}
                                        onClick={() => { setSelectedPaper(paper); setStep(Math.max(step, 3)) }}
                                        className={selectedPaper === paper ? 'btn btn-primary' : 'btn btn-secondary'}
                                    >
                                        {paper}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 4: Options */}
                        <div className="card mb-lg">
                            <h3 className="mb-md">4. Options</h3>

                            <div className="form-group">
                                <label className="label">Impression</label>
                                <select
                                    className="select"
                                    value={selectedSides}
                                    onChange={(e) => setSelectedSides(e.target.value)}
                                >
                                    <option value="RECTO">Recto seul</option>
                                    <option value="RECTO_VERSO">Recto-Verso</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="label">Finition (optionnel)</label>
                                <select
                                    className="select"
                                    value={selectedFinish}
                                    onChange={(e) => setSelectedFinish(e.target.value)}
                                >
                                    <option value="">Sans finition</option>
                                    <option value="Pelliculage mat">Pelliculage mat</option>
                                    <option value="Pelliculage brillant">Pelliculage brillant</option>
                                    <option value="Vernis sélectif">Vernis sélectif</option>
                                </select>
                            </div>

                            <div className="alert alert-info">
                                <strong>📁 Upload de fichiers :</strong> Vous pourrez uploader vos fichiers PDF après l'ajout au panier.
                            </div>
                        </div>
                    </div>

                    {/* Price Summary Sidebar */}
                    <div>
                        <div className="card" style={{ position: 'sticky', top: 'var(--spacing-lg)' }}>
                            <h3 className="mb-md">Récapitulatif</h3>

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <div className="flex justify-between mb-sm">
                                    <span className="text-sm text-secondary">Produit</span>
                                    <span className="text-sm">{product.name}</span>
                                </div>
                                <div className="flex justify-between mb-sm">
                                    <span className="text-sm text-secondary">Quantité</span>
                                    <span className="text-sm font-semibold">{quantity}</span>
                                </div>
                                {selectedFormat && (
                                    <div className="flex justify-between mb-sm">
                                        <span className="text-sm text-secondary">Format</span>
                                        <span className="text-sm">{selectedFormat}</span>
                                    </div>
                                )}
                                {selectedPaper && (
                                    <div className="flex justify-between mb-sm">
                                        <span className="text-sm text-secondary">Papier</span>
                                        <span className="text-sm">{selectedPaper}</span>
                                    </div>
                                )}
                                <div className="flex justify-between mb-sm">
                                    <span className="text-sm text-secondary">Impression</span>
                                    <span className="text-sm">{selectedSides === 'RECTO' ? 'Recto' : 'Recto-Verso'}</span>
                                </div>
                                {selectedFinish && (
                                    <div className="flex justify-between mb-sm">
                                        <span className="text-sm text-secondary">Finition</span>
                                        <span className="text-sm">{selectedFinish}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{
                                padding: 'var(--spacing-md)',
                                background: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--spacing-lg)'
                            }}>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Total TTC</span>
                                    <span className="text-3xl font-bold text-primary">
                                        {price.toFixed(2)} €
                                    </span>
                                </div>
                                <div className="text-xs text-secondary mt-xs text-right">
                                    TVA 20% incluse
                                </div>
                            </div>

                            <button
                                onClick={addToCart}
                                disabled={!selectedFormat || !selectedPaper || loading}
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                            >
                                {loading ? 'Ajout...' : '🛒 Ajouter au panier'}
                            </button>

                            <div className="mt-md text-center text-xs text-secondary">
                                ✓ Paiement sécurisé<br />
                                ✓ Livraison rapide
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
