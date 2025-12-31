import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function AdminOrdersPage() {
    const orders = await prisma.order.findMany({
        include: {
            user: true,
            items: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    })

    return (
        <div>
            <header style={{ backgroundColor: 'var(--color-text)', color: 'white', padding: 'var(--spacing-md) 0' }}>
                <div className="container flex items-center justify-between">
                    <h2>⚙️ Admin Panel</h2>
                    <div className="flex gap-lg">
                        <Link href="/admin" style={{ color: 'white' }}>Dashboard</Link>
                        <Link href="/admin/products" style={{ color: 'white' }}>Produits</Link>
                    </div>
                </div>
            </header>

            <div className="container py-xl">
                <div className="flex items-center justify-between mb-xl">
                    <h1>Gestion des Commandes</h1>
                    <div className="flex gap-md">
                        <select className="select" style={{ width: 'auto' }}>
                            <option>Tous les statuts</option>
                            <option>NEW</option>
                            <option>FILES_OK</option>
                            <option>ORDERED_WITH_SUPPLIER</option>
                            <option>SHIPPED</option>
                        </select>
                    </div>
                </div>

                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Numéro</th>
                                <th>Client</th>
                                <th>Produits</th>
                                <th>Statut</th>
                                <th>Total</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <span className="font-semibold">{order.orderNumber}</span>
                                    </td>
                                    <td>
                                        <div>{order.user.name || 'N/A'}</div>
                                        <div className="text-xs text-secondary">{order.user.email}</div>
                                    </td>
                                    <td className="text-sm">{order.items.length} produit(s)</td>
                                    <td>
                                        <span className={`badge badge-${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="font-semibold">{order.total.toFixed(2)} €</td>
                                    <td className="text-sm text-secondary">
                                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td>
                                        <Link href={`/admin/orders/${order.id}`} className="btn btn-sm btn-primary">
                                            Gérer →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {orders.length === 0 && (
                        <div className="text-center py-2xl text-secondary">
                            Aucune commande pour le moment
                        </div>
                    )}
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
