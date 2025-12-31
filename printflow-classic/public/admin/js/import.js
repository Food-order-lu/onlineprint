// onlineprint.lu - CSV Import Handler

let parsedData = [];
let categories = new Map();
let products = new Map();

document.addEventListener('DOMContentLoaded', function () {
    setupDropZone();
    setupButtons();
});

function setupDropZone() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('csvFile');

    // Click to select
    dropZone.addEventListener('click', () => fileInput.click());

    // File selected
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Drag events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
}

function setupButtons() {
    document.getElementById('removeFile').addEventListener('click', resetUpload);
    document.getElementById('cancelImport').addEventListener('click', resetUpload);
    document.getElementById('confirmImport').addEventListener('click', confirmImport);
}

function handleFile(file) {
    if (!file.name.endsWith('.csv')) {
        alert('Veuillez sélectionner un fichier CSV');
        return;
    }

    // Show file info
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileInfo').style.display = 'block';
    document.getElementById('dropZone').style.display = 'none';

    // Parse CSV
    const reader = new FileReader();
    reader.onload = (e) => {
        parseCSV(e.target.result);
    };
    reader.readAsText(file);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' octets';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

function parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        alert('Le fichier CSV est vide ou invalide');
        return;
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]);

    // Parse data rows
    parsedData = [];
    categories = new Map();
    products = new Map();

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= headers.length) {
            const row = {};
            headers.forEach((h, idx) => {
                row[h.trim()] = values[idx]?.trim() || '';
            });
            parsedData.push(row);

            // Track categories
            if (row.category_slug && !categories.has(row.category_slug)) {
                categories.set(row.category_slug, {
                    slug: row.category_slug,
                    name: row.category_name,
                    icon: row.category_icon
                });
            }

            // Track products
            if (row.product_slug && !products.has(row.product_slug)) {
                products.set(row.product_slug, {
                    slug: row.product_slug,
                    name: row.product_name,
                    description: row.product_description,
                    categorySlug: row.category_slug,
                    variants: []
                });
            }

            // Add variant to product
            if (row.variant_sku && products.has(row.product_slug)) {
                products.get(row.product_slug).variants.push({
                    sku: row.variant_sku,
                    format: row.format,
                    paperType: row.paper_type,
                    paperWeight: row.paper_weight,
                    printSides: row.print_sides,
                    finish: row.finish,
                    leadTimeDays: parseInt(row.lead_time_days) || 5,
                    pricingTiers: buildPricingTiers(row)
                });
            }
        }
    }

    // Show preview
    showPreview(headers);
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    return result;
}

function buildPricingTiers(row) {
    const tiers = [];
    const quantities = [50, 100, 250, 500, 1000, 2500, 5000];
    const margin = parseFloat(row.margin_percent) || 50;

    quantities.forEach((qty, idx) => {
        const costKey = `qty_${qty}_cost`;
        const cost = parseFloat(row[costKey]);

        if (!isNaN(cost) && cost > 0) {
            const nextQty = quantities[idx + 1];
            tiers.push({
                minQuantity: qty,
                maxQuantity: nextQty ? nextQty - 1 : null,
                supplierCost: cost,
                marginPercent: margin
            });
        }
    });

    return tiers;
}

function showPreview(headers) {
    const previewSection = document.getElementById('previewSection');
    previewSection.classList.add('active');

    // Show summary
    const info = document.getElementById('previewInfo');
    info.innerHTML = `
        <strong>Résumé de l'import :</strong>
        <span style="margin-left: 20px;">📁 ${categories.size} catégories</span>
        <span style="margin-left: 20px;">📦 ${products.size} produits</span>
        <span style="margin-left: 20px;">📋 ${parsedData.length} variantes</span>
    `;

    // Show table headers
    const thead = document.getElementById('previewHeaders');
    const displayHeaders = ['Catégorie', 'Produit', 'SKU', 'Format', 'Papier', 'Impression', 'Finition'];
    thead.innerHTML = '<tr>' + displayHeaders.map(h => `<th>${h}</th>`).join('') + '</tr>';

    // Show first 10 rows
    const tbody = document.getElementById('previewBody');
    const previewRows = parsedData.slice(0, 10);

    tbody.innerHTML = previewRows.map(row => `
        <tr>
            <td>${row.category_name || '-'}</td>
            <td><strong>${row.product_name || '-'}</strong></td>
            <td><code>${row.variant_sku || '-'}</code></td>
            <td>${row.format || '-'}</td>
            <td>${row.paper_type || '-'} ${row.paper_weight || ''}</td>
            <td>${row.print_sides === 'RECTO_VERSO' ? 'Recto-verso' : 'Recto'}</td>
            <td>${row.finish || 'Sans'}</td>
        </tr>
    `).join('');

    if (parsedData.length > 10) {
        tbody.innerHTML += `<tr><td colspan="7" style="text-align:center; color:#666;">
            ... et ${parsedData.length - 10} autres variantes
        </td></tr>`;
    }
}

function resetUpload() {
    document.getElementById('dropZone').style.display = 'block';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('previewSection').classList.remove('active');
    document.getElementById('csvFile').value = '';
    parsedData = [];
    categories = new Map();
    products = new Map();
}

function confirmImport() {
    // Build the final data structure
    const exportData = [];

    products.forEach((product, slug) => {
        const cat = categories.get(product.categorySlug);
        exportData.push({
            id: generateId(),
            name: product.name,
            slug: product.slug,
            description: product.description,
            active: true,
            category: cat ? {
                id: generateId(),
                name: cat.name,
                slug: cat.slug,
                icon: cat.icon
            } : null,
            variants: product.variants.map(v => ({
                id: generateId(),
                sku: v.sku,
                format: v.format,
                paperType: v.paperType,
                paperWeight: v.paperWeight,
                printSides: v.printSides,
                finish: v.finish === 'Sans finition' ? null : v.finish,
                leadTimeDays: v.leadTimeDays,
                pricingTiers: v.pricingTiers.map(t => ({
                    id: generateId(),
                    minQuantity: t.minQuantity,
                    maxQuantity: t.maxQuantity,
                    supplierCost: t.supplierCost,
                    marginPercent: t.marginPercent
                }))
            }))
        });
    });

    // Save to localStorage (in a real app, this would be sent to the server)
    localStorage.setItem('importedProducts', JSON.stringify(exportData));

    // Also update the products.json by downloading it
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Show result
    const resultDiv = document.getElementById('importResult');
    resultDiv.style.display = 'block';
    resultDiv.classList.add('success');

    document.getElementById('resultContent').innerHTML = `
        <p style="color: #388e3c; font-size: 18px; margin-bottom: 15px;">
            ✓ Import réussi !
        </p>
        <p><strong>${products.size}</strong> produits et <strong>${parsedData.length}</strong> variantes ont été préparés.</p>
        <p style="margin-top: 15px;">
            <a href="${url}" download="products.json" class="btn btn-action">
                📥 Télécharger products.json
            </a>
        </p>
        <p style="margin-top: 10px; font-size: 13px; color: #666;">
            Placez ce fichier dans le dossier <code>public/data/</code> pour mettre à jour le catalogue.
        </p>
        <p style="margin-top: 20px;">
            <a href="products.html" class="btn btn-secondary">Voir les produits</a>
        </p>
    `;

    // Hide preview
    document.getElementById('previewSection').classList.remove('active');
}

function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
