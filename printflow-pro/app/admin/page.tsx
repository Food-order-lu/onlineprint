import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function AdminDashboard() {
    const stats = await getStats()

    return (
        <div>
            {/* Admin Header */}
            <header style={{
                backgroundColor: 'var(--color-text)',
                color: 'white',
                padding: 'var(--spacing-md) 0 '
            }}>
                <div className="container flex items-center justify-between">
                    <h2>⚙️ Admin Panel</h2>
                    <div className="flex gap-lg">
                        <Link href="/" style={{ color: 'white' }}>← Site</Link>
                        <Link href="/admin/orders" style={{ color: 'white' }}>Commandes</Link>
                        <Link href="/admin/products" style={{ color: 'white' }}>Produits</Link>
                    </div>
                </div>
            </header>

            <div className="container py-xl">
                <h1 className="mb-xl">Tableau de Bord</h1>

                {/* KPI Cards */}
                <div className="grid grid-4 mb-2xl">
                    <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <div className="text-sm mb-sm" style={{ opacity: 0.9 }}>Commandes Aujourd'hui</div>
                        <div className="text-4xl font-bold mb-xs">{stats.ordersToday}</div>
                        <div className="text-xs" style={{ opacity: 0.8 }}>+{stats.ordersWeek} cette semaine</div>
                    </div>

                    <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                        <div className="text-sm mb-sm" style={{ opacity: 0.9 }}>Fichiers en Attente</div>
                        <div className="text-4xl font-bold mb-xs">{stats.pendingFiles}</div>
                        <div className="text-xs" style={{ opacity: 0.8 }}>À valider</div>
                    </div>

                    <div className="card" style={{ background: 'linear-gradient(135deg, #4ade80 0%, #10b981 100%)', color: 'white' }}>
                        <div className="text-sm mb-sm" style={{ opacity: 0.9 }}>Factures à Valider</div>
                        <div className="text-4xl font-bold mb-xs">{stats.pendingInvoices}</div>
                        <div className="text-xs" style={{ opacity: 0.8 }}>Fournisseurs</div>
                    </div>

                    <div className="card" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: 'white' }}>
                        <div className="text-sm mb-sm" style={{ opacity: 0.9 }}>À Expédier</div>
                        <div className="text-4xl font-bold mb-xs">{stats.toShip}</div>
                        <div className="text-xs" style={{ opacity: 0.8 }}>Commandes confirmées</div>
                    </div>
                </div>

                {/* Priority Tasks */}
                <div className="card mb-xl">
                    <h3 className="mb-lg">🎯 À traiter maintenant</h3>

                    {stats.priorityTasks.length === 0 ? (
                        <div className="text-center py-xl text-secondary">
                            ✅ Tout est à jour ! Aucune action urgente nécessaire.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            {stats.priorityTasks.map((task: any, index: number) => (
                                <Link href={task.link} key={index}>
                                    <div className="card" style={{
                                        borderLeft: `4px solid ${task.priority === 'high' ? 'var(--color-error)' : 'var(--color-warning)'}`,
                                        cursor: 'pointer'
                                    }}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold mb-xs">{task.title}</div>
                                                <div className="text-sm text-secondary">{task.description}</div>
                                            </div>
                                            <span className={`badge ${task.priority === 'high' ? 'badge-error' : 'badge-warning'}`}>
                                                {task.priority === 'high' ? 'URGENT' : 'Important'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Orders */}
                <div className="card">
                    <div className="flex items-center justify-between mb-lg">
                        <h3>Dernières Commandes</h3>
                        <Link href="/admin/orders" className="btn btn-sm btn-primary">Voir tout</Link>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Numéro</th>
                                    <th>Client</th>
                                    <th>Statut</th>
                                    <th>Total</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentOrders.map((order: any) => (
                                    <tr key={order.id}>
                                        <td>
                                            <Link href={`/admin/orders/${order.id}`} className="text-primary font-semibold">
                                                {order.orderNumber}
                                            </Link>
                                        </td>
                                        <td>{order.user.email}</td>
                                        <td>
                                            <span className={`badge badge-${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="font-semibold">{order.total.toFixed(2)} €</td>
                                        <td className="text-sm text-secondary">
                                            {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

async function getStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [
        ordersToday,
        ordersWeek,
        pendingFiles,
        pendingInvoices,
        toShip,
        recentOrders
    ] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: today } } }),
        prisma.order.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.order.count({ where: { status: 'NEW' } }),
        prisma.supplierInvoice.count({ where: { matchStatus: 'PENDING' } }),
        prisma.order.count({ where: { status: 'INVOICE_CONFIRMED' } }),
        prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: true },
        }),
    ])

    // Build priority tasks
    const priorityTasks = []
    if (pendingFiles > 0) {
        priorityTasks.push({
            title: `${pendingFiles} commande(s) avec fichiers à valider`,
            description: 'Vérifier les fichiers clients et marquer comme OK ou signaler un problème',
            link: '/admin/orders?status=NEW',
            priority: 'high',
        })
    }
    if (pendingInvoices > 0) {
        priorityTasks.push({
            title: `${pendingInvoices} facture(s) fournisseur à matcher`,
            description: 'Valider la correspondance entre factures fournisseurs et commandes',
            link: '/admin/orders?status=SUPPLIER_INVOICE_UPLOADED',
            priority: 'medium',
        })
    }
    if (toShip > 0) {
        priorityTasks.push({
            title: `${toShip} commande(s) à expédier`,
            description: 'Ajouter les numéros de tracking pour les commandes confirmées',
            link: '/admin/orders?status=INVOICE_CONFIRMED',
            priority: 'medium',
        })
    }

    return {
        ordersToday,
        ordersWeek,
        pendingFiles,
        pendingInvoices,
        toShip,
        priorityTasks,
        recentOrders,
    }
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
