// onlineprint.lu - Product Configurator (Dynamic Version)

let productData = null;
let currentProduct = null;
let availableFormats = new Set();
let availablePapers = new Set();
let availableSides = new Set();
let availableFinishes = new Set();

let currentConfig = {
    format: '',
    paper: '',
    paperWeight: '',
    sides: 'RECTO',
    finish: null,
    quantity: 100
};

// Labels for UI
const labels = {
    sides: {
        'RECTO': 'Recto',
        'RECTO_VERSO': 'Recto-verso'
    }
};

document.addEventListener('DOMContentLoaded', async function () {
    try {
        await loadData();
        buildDynamicOptions();
        initializeConfigurator();
        calculatePrice();
    } catch (error) {
        console.error('Error initializing configurator:', error);
        document.querySelector('.product-header h1').textContent = 'Produit non trouvé';
    }
});

async function loadData() {
    // Show loading state in summary
    document.getElementById('price-total').textContent = 'Chargement...';

    const response = await fetch('data/products.json');
    productData = await response.json();

    // Get product slug from URL
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('id');

    if (!slug) {
        // Default to first product
        currentProduct = productData[0];
    } else {
        currentProduct = productData.find(p => p.slug === slug);
    }

    if (!currentProduct) {
        throw new Error('Product not found');
    }

    // Update page title and header
    document.title = `${currentProduct.name} - Configuration | onlineprint.lu`;
    document.querySelector('.product-header h1').textContent = currentProduct.name;
    document.querySelector('.product-header p').textContent = currentProduct.description;

    // Extract available options from variants
    extractOptionsFromVariants();
}

function extractOptionsFromVariants() {
    availableFormats = new Set();
    availablePapers = new Set();
    availableSides = new Set();
    availableFinishes = new Set();

    currentProduct.variants.forEach(v => {
        if (v.format) availableFormats.add(v.format);
        if (v.paperType) availablePapers.add(`${v.paperType}|${v.paperWeight}`);
        if (v.printSides) availableSides.add(v.printSides);
        availableFinishes.add(v.finish || 'none');
    });

    // Set defaults from first variant
    const firstVariant = currentProduct.variants[0];
    currentConfig.format = firstVariant.format;
    currentConfig.paper = firstVariant.paperType;
    currentConfig.paperWeight = firstVariant.paperWeight;
    currentConfig.sides = firstVariant.printSides;
    currentConfig.finish = firstVariant.finish;
}

function buildDynamicOptions() {
    // Build Format options
    buildFormatOptions();

    // Build Paper options
    buildPaperOptions();

    // Build Sides options
    buildSidesOptions();

    // Build Finish options
    buildFinishOptions();

    // Update quantity presets based on pricing tiers
    updateQuantityPresets();
}

function buildFormatOptions() {
    const container = document.querySelector('.config-section:nth-child(1) .option-grid');
    if (!container) return;

    const formatsArray = Array.from(availableFormats);

    container.innerHTML = formatsArray.map((format, idx) => `
        <label class="option-card">
            <input type="radio" name="format" value="${format}" ${idx === 0 ? 'checked' : ''}>
            <div class="option-content">
                <div class="option-icon">📏</div>
                <div class="option-title">${format}</div>
                <div class="option-desc">${getFormatDescription(format)}</div>
            </div>
        </label>
    `).join('');
}

function getFormatDescription(format) {
    const descriptions = {
        '85x55mm': 'Format standard',
        '90x50mm': 'Format américain',
        '55x55mm': 'Format carré',
        'A6 (105x148mm)': 'Petit format',
        'A5 (148x210mm)': 'Format moyen',
        'A4 (210x297mm)': 'Grand format',
        'A3 (297x420mm)': 'Très grand format',
        'A2 (420x594mm)': 'Format affiche',
        'A1 (594x841mm)': 'Grande affiche',
        'A5 fermé (A4 ouvert)': '4 pages',
        'DL fermé (A4 ouvert)': 'Format lettre',
        'Rectangle 50x30mm': 'Petite étiquette',
        'Rectangle 100x50mm': 'Étiquette moyenne',
        'Rond 50mm': 'Format rond',
        '85x200cm': 'Standard',
        '100x200cm': 'Large',
        '100x50cm': 'Petit format',
        '200x100cm': 'Format moyen',
        '300x100cm': 'Grand format'
    };
    return descriptions[format] || '';
}

function buildPaperOptions() {
    const container = document.querySelector('.config-section:nth-child(2) .option-list');
    if (!container) return;

    const papersArray = Array.from(availablePapers);

    container.innerHTML = papersArray.map((paperKey, idx) => {
        const [paperType, paperWeight] = paperKey.split('|');
        return `
            <label class="option-row">
                <input type="radio" name="paper" value="${paperKey}" ${idx === 0 ? 'checked' : ''}>
                <div class="option-info">
                    <strong>${paperType} ${paperWeight}</strong>
                    <span class="option-detail">${getPaperDescription(paperType)}</span>
                </div>
                <div class="option-price">Inclus</div>
            </label>
        `;
    }).join('');
}

function getPaperDescription(paperType) {
    const descriptions = {
        'Couché mat': 'Finition mate élégante',
        'Couché brillant': 'Couleurs vives et éclatantes',
        'Papier blanc': 'Standard pour étiquettes',
        'Vinyle blanc': 'Résistant eau et UV',
        'Bâche PVC': 'Usage extérieur intensif',
        'PVC 510g': 'Haute résistance'
    };
    return descriptions[paperType] || '';
}

function buildSidesOptions() {
    const container = document.querySelector('.config-section:nth-child(3) .option-grid');
    if (!container) return;

    const sidesArray = Array.from(availableSides);

    container.innerHTML = sidesArray.map((side, idx) => `
        <label class="option-card">
            <input type="radio" name="sides" value="${side}" ${idx === 0 ? 'checked' : ''}>
            <div class="option-content">
                <div class="option-icon">${side === 'RECTO' ? '📄' : '📑'}</div>
                <div class="option-title">${labels.sides[side]}</div>
                <div class="option-desc">${side === 'RECTO' ? 'Un seul côté' : 'Deux côtés'}</div>
            </div>
        </label>
    `).join('');
}

function buildFinishOptions() {
    const container = document.querySelector('.config-section:nth-child(4) .option-list');
    if (!container) return;

    const finishesArray = Array.from(availableFinishes);

    container.innerHTML = finishesArray.map((finish, idx) => {
        const displayName = finish === 'none' ? 'Sans finition' : finish;
        return `
            <label class="option-row">
                <input type="radio" name="finish" value="${finish}" ${idx === 0 ? 'checked' : ''}>
                <div class="option-info">
                    <strong>${displayName}</strong>
                    <span class="option-detail">${getFinishDescription(finish)}</span>
                </div>
                <div class="option-price">${finish === 'none' ? 'Inclus' : 'Voir prix'}</div>
            </label>
        `;
    }).join('');
}

function getFinishDescription(finish) {
    const descriptions = {
        'none': 'Aucun traitement supplémentaire',
        'Pelliculage mat': 'Protection anti-rayures • Aspect soft-touch',
        'Pelliculage brillant': 'Protection anti-rayures • Rendu éclatant',
        'Vernis sélectif': 'Effet haut de gamme • Relief brillant'
    };
    return descriptions[finish] || '';
}

function updateQuantityPresets() {
    // Get min quantities from pricing tiers
    const firstVariant = currentProduct.variants[0];
    if (!firstVariant || !firstVariant.pricingTiers) return;

    const quantities = firstVariant.pricingTiers.map(t => t.minQuantity).sort((a, b) => a - b);

    const container = document.querySelector('.quantity-presets');
    if (!container) return;

    container.innerHTML = quantities.slice(0, 6).map((qty, idx) => `
        <button type="button" class="qty-preset ${idx === 1 ? 'active' : ''}" data-qty="${qty}">${qty}</button>
    `).join('');

    // Set default quantity
    currentConfig.quantity = quantities[1] || quantities[0] || 100;
    document.getElementById('quantity').value = currentConfig.quantity;
}

function initializeConfigurator() {
    // Format selection
    document.querySelectorAll('input[name="format"]').forEach(input => {
        input.addEventListener('change', function () {
            currentConfig.format = this.value;
            updateUI();
        });
    });

    // Paper selection
    document.querySelectorAll('input[name="paper"]').forEach(input => {
        input.addEventListener('change', function () {
            const [paperType, paperWeight] = this.value.split('|');
            currentConfig.paper = paperType;
            currentConfig.paperWeight = paperWeight;
            updateUI();
        });
    });

    // Sides selection
    document.querySelectorAll('input[name="sides"]').forEach(input => {
        input.addEventListener('change', function () {
            currentConfig.sides = this.value;
            updateUI();
        });
    });

    // Finish selection
    document.querySelectorAll('input[name="finish"]').forEach(input => {
        input.addEventListener('change', function () {
            currentConfig.finish = this.value === 'none' ? null : this.value;
            updateUI();
        });
    });

    // Quantity presets
    document.querySelectorAll('.qty-preset').forEach(button => {
        button.addEventListener('click', function () {
            const qty = parseInt(this.dataset.qty);
            setQuantity(qty);
            document.querySelectorAll('.qty-preset').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Custom quantity input
    const quantityInput = document.getElementById('quantity');
    quantityInput.addEventListener('change', function () {
        setQuantity(parseInt(this.value));
        document.querySelectorAll('.qty-preset').forEach(btn => btn.classList.remove('active'));
    });

    // Add to cart button
    document.getElementById('addToCartBtn').addEventListener('click', function () {
        addToCartFromConfig();
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', function () {
            const tabId = this.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Update summary with initial values
    updateSummary();
}

function setQuantity(qty) {
    currentConfig.quantity = qty;
    document.getElementById('quantity').value = qty;
    updateUI();
}

function updateUI() {
    updateSummary();
    calculatePrice();
    renderPriceGrid();
}

function updateSummary() {
    document.getElementById('summary-format').textContent = currentConfig.format;
    document.getElementById('summary-paper').textContent = `${currentConfig.paper} ${currentConfig.paperWeight}`;
    document.getElementById('summary-sides').textContent = labels.sides[currentConfig.sides] || currentConfig.sides;
    document.getElementById('summary-finish').textContent = currentConfig.finish || 'Sans finition';
    document.getElementById('summary-quantity').textContent = currentConfig.quantity + ' ex.';
}

function findMatchingVariant() {
    if (!currentProduct) return null;

    return currentProduct.variants.find(v => {
        const formatMatch = v.format === currentConfig.format;
        const paperMatch = v.paperType === currentConfig.paper;
        const sidesMatch = v.printSides === currentConfig.sides;
        const finishMatch = (v.finish === currentConfig.finish) ||
            (v.finish === null && currentConfig.finish === null);

        return formatMatch && paperMatch && sidesMatch && finishMatch;
    });
}

function calculatePrice() {
    const variant = findMatchingVariant();

    if (!variant) {
        // Try to find any variant that matches format and paper (show as available)
        document.getElementById('price-total').innerHTML = '<span style="font-size: 14px; color: #cc0000;">Configuration non disponible</span>';
        document.getElementById('price-ht').textContent = '-';
        document.getElementById('price-vat').textContent = '-';
        document.getElementById('price-unit').textContent = '-';
        return;
    }

    const qty = currentConfig.quantity;

    // Find matching tier
    const tier = variant.pricingTiers.find(t => {
        return qty >= t.minQuantity && (t.maxQuantity === null || qty <= t.maxQuantity);
    }) || variant.pricingTiers[variant.pricingTiers.length - 1];

    if (!tier) return;

    // Calculate price based on supplier cost and margin
    // supplierCost is the TOTAL cost for the tier's minQuantity
    // We calculate unit cost, then apply margin
    const tierQty = tier.minQuantity;
    const supplierUnitCost = tier.supplierCost / tierQty;
    const margin = tier.marginPercent / 100;
    const sellingUnitPrice = supplierUnitCost * (1 + margin);

    const totalHT = sellingUnitPrice * qty;
    const vat = totalHT * 0.17; // Luxembourg VAT 17%
    const totalTTC = totalHT + vat;

    // Update display - show unit price with 4 decimals for precision
    document.getElementById('price-unit').textContent = sellingUnitPrice.toFixed(4).replace('.', ',') + ' €';
    document.getElementById('price-ht').textContent = totalHT.toFixed(2).replace('.', ',') + ' €';
    document.getElementById('price-vat').textContent = vat.toFixed(2).replace('.', ',') + ' €';
    document.getElementById('price-total').textContent = totalTTC.toFixed(2).replace('.', ',') + ' €';
}


function renderPriceGrid() {
    const variant = findMatchingVariant();
    if (!variant) {
        const gridContainer = document.querySelector('.price-grid-section');
        if (gridContainer) gridContainer.style.display = 'none';
        return;
    }

    // Ensure we have a container for the price grid
    let gridSection = document.querySelector('.price-grid-section');
    if (!gridSection) {
        gridSection = document.createElement('div');
        gridSection.className = 'price-grid-section';
        // Insert after the last config section
        const configForm = document.getElementById('productConfigForm');
        configForm.appendChild(gridSection);
    }

    gridSection.style.display = 'block';

    let html = `
        <div class="price-grid-header">
            <h4>📊 Tableau des prix dégressifs</h4>
        </div>
        <div class="price-table-wrapper">
            <table class="price-table">
                <thead>
                    <tr>
                        <th>Quantité</th>
                        <th>Prix HT</th>
                        <th>Prix TTC</th>
                        <th>Prix Unitaire</th>
                    </tr>
                </thead>
                <tbody>
    `;

    variant.pricingTiers.forEach(tier => {
        const qty = tier.minQuantity;
        // supplierCost is total for the tier, divide by qty for unit cost
        const supplierUnitCost = tier.supplierCost / qty;
        const sellingUnitPrice = supplierUnitCost * (1 + tier.marginPercent / 100);
        const totalHT = tier.supplierCost * (1 + tier.marginPercent / 100);
        const totalTTC = totalHT * 1.17;
        const isActive = currentConfig.quantity === qty;

        html += `
            <tr class="${isActive ? 'active' : ''}" onclick="setQuantity(${qty})" style="cursor: pointer;">
                <td><strong>${qty.toLocaleString('fr-FR')} ex.</strong></td>
                <td>${totalHT.toFixed(2).replace('.', ',')} €</td>
                <td class="price-cell">${totalTTC.toFixed(2).replace('.', ',')} €</td>
                <td><span class="unit-price">${sellingUnitPrice.toFixed(4).replace('.', ',')} € / pièce</span></td>
            </tr>
        `;
    });


    html += `
                </tbody>
            </table>
        </div>
    `;

    gridSection.innerHTML = html;
}

// Make setQuantity global for onclick
window.setQuantity = setQuantity;

function addToCartFromConfig() {
    const variant = findMatchingVariant();
    if (!variant) {
        alert('Veuillez sélectionner une configuration valide.');
        return;
    }

    const priceText = document.getElementById('price-total').textContent;
    const price = parseFloat(priceText.replace(' €', '').replace(',', '.'));

    // Find matching tier for supplier cost
    const qty = currentConfig.quantity;
    const tier = variant.pricingTiers.find(t =>
        qty >= t.minQuantity && (t.maxQuantity === null || qty <= t.maxQuantity)
    ) || variant.pricingTiers[variant.pricingTiers.length - 1];

    // supplierCost in tier is total for tier.minQuantity, calculate unit cost
    const supplierUnitCost = tier ? (tier.supplierCost / tier.minQuantity) : 0;
    const supplierTotalCost = supplierUnitCost * qty;

    const cartItem = {
        id: `${currentProduct.slug}-${Date.now()}`,
        name: currentProduct.name,
        details: `${currentConfig.format} • ${currentConfig.paper} ${currentConfig.paperWeight} • ${labels.sides[currentConfig.sides]} • ${currentConfig.finish || 'Sans finition'}`,
        quantity: currentConfig.quantity,
        price: price,
        supplierCost: supplierTotalCost,
        marginPercent: tier ? tier.marginPercent : 50,
        sku: variant.sku,
        uploadedFile: uploadedFileName || null
    };

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));

    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }

    alert(`✓ Ajouté au panier!\n\n${cartItem.name}\n${cartItem.details}\nQuantité: ${cartItem.quantity}\nTotal: ${price.toFixed(2)} €`);
}

// File Upload Handling
let uploadedFileName = null;

function initFileUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileUpload');
    const removeBtn = document.getElementById('removeFileBtn');

    if (!uploadZone) return;

    uploadZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', removeUploadedFile);
    }
}

function handleFileUpload(file) {
    const maxSize = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxSize) {
        alert('Fichier trop volumineux. Maximum 100 Mo.');
        return;
    }

    uploadedFileName = file.name;

    document.getElementById('uploadFileName').textContent = file.name;
    document.getElementById('uploadFileSize').textContent = formatFileSize(file.size);
    document.getElementById('uploadZone').style.display = 'none';
    document.getElementById('uploadedFile').style.display = 'block';
}

function removeUploadedFile() {
    uploadedFileName = null;
    document.getElementById('fileUpload').value = '';
    document.getElementById('uploadZone').style.display = 'block';
    document.getElementById('uploadedFile').style.display = 'none';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' octets';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

// Initialize file upload on load
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(initFileUpload, 500);
});
