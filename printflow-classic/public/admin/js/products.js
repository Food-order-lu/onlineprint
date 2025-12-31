// onlineprint.lu - Products Management

let allProducts = [];
let categories = {};

document.addEventListener('DOMContentLoaded', function () {
    loadProducts();
    setupSearch();
});

async function loadProducts() {
    try {
        const response = await fetch('../data/products.json');
        allProducts = await response.json();

        // Build category data
        buildCategoryData();

        // Render products grid
        renderProductsGrid(allProducts);

        // Render category summary
        renderCategorySummary();

        // Populate category filter
        populateCategoryFilter();

        document.getElementById('productCount').textContent = allProducts.length;
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsGrid').innerHTML =
            '<p class="empty-state">Aucun produit trouvé. <a href="import.html">Importez des produits</a></p>';
    }
}

function buildCategoryData() {
    categories = {};
    allProducts.forEach(product => {
        const cat = product.category;
        if (cat) {
            if (!categories[cat.slug]) {
                categories[cat.slug] = {
                    name: cat.name,
                    icon: cat.icon || '📦',
                    products: [],
                    variantCount: 0
                };
            }
            categories[cat.slug].products.push(product);
            categories[cat.slug].variantCount += product.variants ? product.variants.length : 0;
        }
    });
}

function renderProductsGrid(products) {
    const grid = document.getElementById('productsGrid');

    if (!products || products.length === 0) {
        grid.innerHTML = '<p class="empty-state">Aucun produit trouvé</p>';
        return;
    }

    grid.innerHTML = products.map(product => {
        const variantCount = product.variants ? product.variants.length : 0;
        const minPrice = getMinPrice(product);

        return `
            <div class="admin-product-card">
                <div class="admin-product-image">
                    ${product.category?.icon || '📦'}
                </div>
                <div class="admin-product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description || 'Pas de description'}</p>
                    <div class="admin-product-meta">
                        <span>📋 ${variantCount} variantes</span>
                        <span>💰 À partir de ${minPrice.toFixed(2)} €</span>
                    </div>
                </div>
                <div class="admin-product-actions">
                    <a href="product-edit.html?id=${product.id}" class="btn btn-secondary">✏️ Modifier</a>
                    <a href="../product.html?id=${product.slug}" target="_blank" class="btn btn-primary">👁️ Voir</a>
                </div>
            </div>
        `;
    }).join('');
}

function getMinPrice(product) {
    if (!product.variants || product.variants.length === 0) return 0;

    let minPrice = Infinity;
    product.variants.forEach(variant => {
        if (variant.pricingTiers && variant.pricingTiers.length > 0) {
            variant.pricingTiers.forEach(tier => {
                const price = tier.supplierCost * (1 + (tier.marginPercent / 100));
                if (price < minPrice) minPrice = price;
            });
        }
    });

    return minPrice === Infinity ? 0 : minPrice;
}

function renderCategorySummary() {
    const tbody = document.getElementById('categorySummary');
    const catArray = Object.entries(categories);

    if (catArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Aucune catégorie</td></tr>';
        return;
    }

    tbody.innerHTML = catArray.map(([slug, cat]) => `
        <tr>
            <td><strong>${cat.icon} ${cat.name}</strong></td>
            <td>${cat.products.length}</td>
            <td>${cat.variantCount}</td>
            <td>
                <a href="products.html?category=${slug}" class="btn btn-secondary btn-sm">Voir</a>
            </td>
        </tr>
    `).join('');
}

function populateCategoryFilter() {
    const select = document.getElementById('categoryFilter');
    Object.entries(categories).forEach(([slug, cat]) => {
        const option = document.createElement('option');
        option.value = slug;
        option.textContent = `${cat.icon} ${cat.name} (${cat.products.length})`;
        select.appendChild(option);
    });
}

function setupSearch() {
    const searchInput = document.getElementById('productSearch');
    const categoryFilter = document.getElementById('categoryFilter');

    searchInput.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);
}

function filterProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const categorySlug = document.getElementById('categoryFilter').value;

    let filtered = allProducts;

    // Filter by category
    if (categorySlug) {
        filtered = filtered.filter(p => p.category?.slug === categorySlug);
    }

    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.description?.toLowerCase().includes(searchTerm) ||
            p.slug.toLowerCase().includes(searchTerm)
        );
    }

    renderProductsGrid(filtered);
    document.getElementById('productCount').textContent = filtered.length;
}
