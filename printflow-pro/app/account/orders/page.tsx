import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function CustomerOrdersPage() {
    // In production, get userId from session
    const orders = await prisma.order.findMany({
        where: {
            // userId would come from session
        },
        include: {
            items: true,
            shipment: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    })

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
                    <Link href="/account" style={{ color: 'white' }}>← Retour au compte</Link>
                </div>
            </header>

            <div className="container py-xl">
                <h1 className="mb-xl">Mes Commandes</h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {orders.map((order) => (
                        <div key={order.id} className="card">
                            <div className="flex items-center justify-between mb-md">
                                <div>
                                    <div className="flex items-center gap-md mb-xs">
                                        <span className="font-bold">{order.orderNumber}</span>
                                        <span className={`badge badge-${getStatusColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-secondary">
                                        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="text-2xl font-bold text-primary">{order.total.toFixed(2)} €</div>
                                    <div className="text-xs text-secondary">TVA incluse</div>
                                </div>
                            </div>

                            <div className="mb-md">
                                <div className="text-sm font-semibold mb-xs">Produits:</div>
                                {order.items.map((item: any, index: number) => (
                                    <div key={index} className="text-sm text-secondary">
                                        • {item.productName} × {item.quantity}
                                    </div>
                                ))}
                            </div>

                            {order.shipment && (
                                <div className="alert alert-success mb-md">
                                    <strong>📦 Expédié !</strong> Tracking: {order.shipment.trackingNumber}
                                    {order.shipment.trackingUrl && (
                                        <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="ml-sm">
                                            Suivre mon colis →
                                        </a>
                                    )}
                                </div>
                            )}

                            <Link href={`/account/orders/${order.id}`} className="btn btn-primary">
                                Voir les détails →
                            </Link>
                        </div>
                    ))}
                </div>

                {orders.length === 0 && (
                    <div className="card text-center py-2xl">
                        <p className="text-secondary mb-md">Vous n'avez pas encore passé de commande.</p>
                        <Link href="/catalog" className="btn btn-primary">
                            Découvrir nos produits
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

function getStatusColor(status: string) {
    const colors: Record<string, string> = {
        NEW: 'primary',
        FILES_OK: 'success',
        FILES_ISSUE: 'warning',
        ORDERED_WITH_SUPPLIER: 'info',
        INVOICE_CONFIRMED: 'success',
        SHIPPED: 'success',
        DELIVERED: 'success',
    }
    return colors[status] || 'secondary'
}

function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
        NEW: 'Nouvelle',
        FILES_OK: 'Fichiers validés',
        FILES_ISSUE: 'Action requise',
        ORDERED_WITH_SUPPLIER: 'En production',
        INVOICE_CONFIRMED: 'Prête à expédier',
        SHIPPED: 'Expédiée',
        DELIVERED: 'Livrée',
    }
    return labels[status] || status
}
