'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function OrderDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [supplierRef, setSupplierRef] = useState('')
    const [trackingNumber, setTrackingNumber] = useState('')

    // Fetch order data
    useState(() => {
        fetch(`/api/admin/orders/${params.id}`)
            .then(res => res.json())
            .then(data => setOrder(data))
    })

    const updateStatus = async (newStatus: string) => {
        setLoading(true)
        await fetch(`/api/admin/orders/${params.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        })
        router.refresh()
        setLoading(false)
    }

    const addSupplierOrder = async () => {
        setLoading(true)
        await fetch(`/api/admin/orders/${params.id}/supplier-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                supplierName: 'PrintSupplier',
                supplierRef
            }),
        })
        await updateStatus('ORDERED_WITH_SUPPLIER')
        setLoading(false)
    }

    const addTracking = async () => {
        setLoading(true)
        await fetch(`/api/admin/orders/${params.id}/shipping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                carrier: 'GLS',
                trackingNumber,
                trackingUrl: `https://gls-group.eu/track/${trackingNumber}`
            }),
        })
        await updateStatus('SHIPPED')
        setLoading(false)
    }

    if (!order) {
        return <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}><div className="spinner"></div></div>
    }

    return (
        <div>
            <header style={{ backgroundColor: 'var(--color-text)', color: 'white', padding: 'var(--spacing-md) 0' }}>
                <div className="container flex items-center justify-between">
                    <h2>⚙️ Admin Panel</h2>
                    <Link href="/admin/orders" style={{ color: 'white' }}>← Retour aux commandes</Link>
                </div>
            </header>

            <div className="container py-xl">
                <div className="flex items-center justify-between mb-xl">
                    <div>
                        <h1>Commande {order.orderNumber}</h1>
                        <p className="text-secondary">Client: {order.user.email}</p>
                    </div>
                    <span className={`badge badge-${getStatusColor(order.status)}`} style={{ fontSize: 'var(--text-lg)', padding: 'var(--spacing-sm) var(--spacing-lg)' }}>
                        {order.status}
                    </span>
                </div>

                <div className="grid grid-2 mb-xl">
                    <div className="card">
                        <h3 className="mb-md">📋 Informations</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            <div className="flex justify-between">
                                <span className="text-secondary">Total HT:</span>
                                <span className="font-semibold">{order.subtotalHT.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary">TVA:</span>
                                <span>{order.vatAmount.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary">Total TTC:</span>
                                <span className="font-bold text-xl">{order.total.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between mt-md">
                                <span className="text-secondary">Paiement:</span>
                                <span className={`badge badge-${order.paymentStatus === 'PAID' ? 'success' : 'warning'}`}>
                                    {order.paymentStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="mb-md">📦 Produits</h3>
                        {order.items.map((item: any, index: number) => (
                            <div key={index} className="mb-md">
                                <div className="font-semibold">{item.productName}</div>
                                <div className="text-sm text-secondary">
                                    Quantité: {item.quantity} × {item.unitPriceHT.toFixed(2)} € HT
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Workflow Actions */}
                <div className="card mb-xl">
                    <h3 className="mb-lg">🔄 Workflow de Traitement</h3>

                    {order.status === 'NEW' && (
                        <div className="alert alert-info mb-md">
                            <strong>Étape 1 :</strong> Valider les fichiers du client
                        </div>
                    )}

                    {order.status === 'NEW' && (
                        <div className="flex gap-md">
                            <button onClick={() => updateStatus('FILES_OK')} className="btn btn-success">
                                ✅ Fichiers OK
                            </button>
                            <button onClick={() => updateStatus('FILES_ISSUE')} className="btn btn-outline" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}>
                                ⚠️ Problème fichiers
                            </button>
                        </div>
                    )}

                    {order.status === 'FILES_OK' && (
                        <>
                            <div className="alert alert-info mb-md">
                                <strong>Étape 2 :</strong> Commander chez le fournisseur
                            </div>
                            <div className="form-group">
                                <label className="label">Référence fournisseur</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={supplierRef}
                                    onChange={(e) => setSupplierRef(e.target.value)}
                                    placeholder="Référence commande fournisseur"
                                />
                            </div>
                            <button onClick={addSupplierOrder} disabled={!supplierRef || loading} className="btn btn-primary">
                                ✓ Marquer comme commandé
                            </button>
                        </>
                    )}

                    {order.status === 'INVOICE_CONFIRMED' && (
                        <>
                            <div className="alert alert-success mb-md">
                                <strong>Étape 3 :</strong> Ajouter le tracking d'expédition
                            </div>
                            <div className="form-group">
                                <label className="label">Numéro de tracking (GLS)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    placeholder="Numéro de suivi GLS"
                                />
                            </div>
                            <button onClick={addTracking} disabled={!trackingNumber || loading} className="btn btn-success">
                                🚚 Marquer comme expédié
                            </button>
                        </>
                    )}

                    {order.status === 'SHIPPED' && (
                        <div className="alert alert-success">
                            ✅ Commande expédiée ! Le client a reçu un email avec le tracking.
                        </div>
                    )}
                </div>

                {/* Notes Section */}
                <div className="card">
                    <h3 className="mb-md">📝 Notes internes</h3>
                    <textarea className="textarea" placeholder="Ajouter des notes internes..." rows={4}></textarea>
                    <button className="btn btn-secondary mt-md">Sauvegarder</button>
                </div>
            </div>
        </div>
    )
}

function getStatusColor(status: string) {
    const colors: Record<string, string> = {
        NEW: 'primary',
        FILES_OK: 'success',
        FILES_ISSUE: 'error',
        ORDERED_WITH_SUPPLIER: 'warning',
        INVOICE_CONFIRMED: 'success',
        SHIPPED: 'success',
        DELIVERED: 'secondary',
    }
    return colors[status] || 'secondary'
}
