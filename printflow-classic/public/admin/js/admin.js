// onlineprint.lu - Admin JavaScript

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function () {
    loadDashboardData();
});

function loadDashboardData() {
    // Load products from JSON
    fetch('../data/products.json')
        .then(res => res.json())
        .then(products => {
            // Update KPIs
            document.getElementById('kpi-products').textContent = products.length;

            // Count total variants
            let totalVariants = 0;
            products.forEach(p => {
                totalVariants += p.variants ? p.variants.length : 0;
            });
        })
        .catch(err => {
            console.log('No products data yet');
        });

    // Load orders (from localStorage for demo)
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    document.getElementById('kpi-orders').textContent = orders.filter(o => o.status === 'new').length;

    // Calculate revenue
    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    document.getElementById('kpi-revenue').textContent = revenue.toFixed(2) + ' €';

    // Load customers (demo)
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    document.getElementById('kpi-customers').textContent = customers.length;

    // Render recent orders
    renderRecentOrders(orders.slice(0, 5));
}

function renderRecentOrders(orders) {
    const tbody = document.getElementById('recent-orders');
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Aucune commande pour le moment</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>#${order.id}</strong></td>
            <td>${order.customerName || 'Client'}</td>
            <td>${formatDate(order.createdAt)}</td>
            <td><strong>${order.total?.toFixed(2) || '0.00'} €</strong></td>
            <td><span class="status-badge status-${order.status}">${getStatusLabel(order.status)}</span></td>
            <td>
                <a href="order-detail.html?id=${order.id}" class="btn btn-secondary btn-sm">Voir</a>
            </td>
        </tr>
    `).join('');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusLabel(status) {
    const labels = {
        'new': 'Nouvelle',
        'processing': 'En cours',
        'production': 'Production',
        'shipped': 'Expédiée',
        'completed': 'Terminée',
        'cancelled': 'Annulée'
    };
    return labels[status] || status;
}
