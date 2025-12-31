// onlineprint.lu - Orders Management with Margin Tracking

document.addEventListener('DOMContentLoaded', function () {
    loadOrders();
});

function loadOrders() {
    // Get cart items as "orders" for demo purposes
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');

    // Combine cart items and orders for display
    const allItems = [...orders, ...cart.map((item, idx) => ({
        id: item.id || `ORD-${Date.now()}-${idx}`,
        createdAt: item.createdAt || new Date().toISOString(),
        product: item.name,
        details: item.details,
        quantity: item.quantity,
        price: item.price || 0,
        supplierCost: item.supplierCost || (item.price * 0.6), // Estimate if not available
        marginPercent: item.marginPercent || 50,
        status: item.status || 'pending',
        sku: item.sku
    }))];

    renderOrders(allItems);
    updateKPIs(allItems);
}

function renderOrders(orders) {
    const tbody = document.getElementById('ordersBody');
    const totals = document.getElementById('ordersTotals');

    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">Aucune commande pour le moment. Ajoutez des produits au panier depuis le site.</td></tr>';
        totals.style.display = 'none';
        return;
    }

    totals.style.display = 'table-footer-group';

    let totalRevenue = 0;
    let totalCost = 0;

    tbody.innerHTML = orders.map(order => {
        const revenue = order.price || 0;
        const cost = order.supplierCost || 0;
        const margin = revenue - cost;
        const marginPct = revenue > 0 ? ((margin / revenue) * 100) : 0;

        totalRevenue += revenue;
        totalCost += cost;

        const marginClass = margin >= 0 ? 'margin-positive' : 'margin-negative';

        return `
            <tr>
                <td><strong>#${order.id.substring(0, 12)}</strong></td>
                <td>${formatDate(order.createdAt)}</td>
                <td>
                    <strong>${order.product}</strong>
                    <br><small style="color: #666;">${order.details || ''}</small>
                </td>
                <td>${order.quantity}</td>
                <td><strong>${revenue.toFixed(2).replace('.', ',')} €</strong></td>
                <td>${cost.toFixed(2).replace('.', ',')} €</td>
                <td class="${marginClass}" style="background: #f1f8e9; color: #2e7d32; font-weight: bold;">
                    ${margin.toFixed(2).replace('.', ',')} €
                </td>
                <td class="${marginClass}" style="background: #f1f8e9; color: #2e7d32; font-weight: bold;">
                    ${marginPct.toFixed(1)}%
                </td>
                <td><span class="status-badge status-${order.status}">${getStatusLabel(order.status)}</span></td>
            </tr>
        `;
    }).join('');

    // Update totals row
    const totalMargin = totalRevenue - totalCost;
    const avgMarginPct = totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100) : 0;

    document.getElementById('foot-revenue').textContent = totalRevenue.toFixed(2).replace('.', ',') + ' €';
    document.getElementById('foot-cost').textContent = totalCost.toFixed(2).replace('.', ',') + ' €';
    document.getElementById('foot-margin').textContent = totalMargin.toFixed(2).replace('.', ',') + ' €';
    document.getElementById('foot-margin-pct').textContent = avgMarginPct.toFixed(1) + '%';
}

function updateKPIs(orders) {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.price || 0), 0);
    const totalCost = orders.reduce((sum, o) => sum + (o.supplierCost || 0), 0);
    const totalMargin = totalRevenue - totalCost;
    const avgMarginPct = totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100) : 0;

    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-revenue').textContent = totalRevenue.toFixed(2).replace('.', ',') + ' €';
    document.getElementById('total-margin').textContent = totalMargin.toFixed(2).replace('.', ',') + ' €';
    document.getElementById('avg-margin-percent').textContent = avgMarginPct.toFixed(1) + '%';
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
        'pending': 'En attente',
        'new': 'Nouvelle',
        'processing': 'En cours',
        'production': 'Production',
        'shipped': 'Expédiée',
        'completed': 'Terminée',
        'cancelled': 'Annulée'
    };
    return labels[status] || status;
}

function createTestOrder() {
    const testOrder = {
        id: 'TEST-' + Date.now(),
        createdAt: new Date().toISOString(),
        product: 'Cartes de visite standard',
        details: '85x55mm • Couché mat 350g • Recto-verso • Pelliculage mat',
        quantity: 250,
        price: 54.17, // Selling price TTC
        supplierCost: 34.90, // wir-machen-druck cost
        marginPercent: 55,
        status: 'new',
        sku: 'CV-85x55-MAT350-RV-PELLMAT'
    };

    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(testOrder);
    localStorage.setItem('orders', JSON.stringify(orders));

    loadOrders();
    alert('Commande test créée!');
}
