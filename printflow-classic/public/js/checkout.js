// onlineprint.lu - Checkout JavaScript

document.addEventListener('DOMContentLoaded', function () {
    loadCart();
    initFormHandlers();
    updateTotals();
});

// Load cart from localStorage
function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartContainer = document.getElementById('cartItems');

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <p>Votre panier est vide</p>
                <a href="index.html" class="btn btn-secondary">Voir nos produits</a>
            </div>
        `;
        document.getElementById('submitBtn').disabled = true;
        return;
    }

    cartContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">📦</div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-specs">${item.details || ''}</div>
                <div class="cart-item-qty">Quantité: ${item.quantity}</div>
            </div>
            <div class="cart-item-price">${item.price.toFixed(2).replace('.', ',')} €</div>
        </div>
    `).join('');
}

// Initialize form handlers
function initFormHandlers() {
    // Customer type toggle
    const typeInputs = document.querySelectorAll('input[name="customerType"]');
    typeInputs.forEach(input => {
        input.addEventListener('change', handleCustomerTypeChange);
    });

    // Country change
    document.getElementById('country').addEventListener('change', handleCountryChange);

    // VAT number input
    const vatInput = document.getElementById('vatNumber');
    if (vatInput) {
        vatInput.addEventListener('input', debounce(handleVatNumberChange, 500));
    }

    // Customer handles VAT checkbox
    const vatCheckbox = document.getElementById('customerHandlesVat');
    if (vatCheckbox) {
        vatCheckbox.addEventListener('change', updateTotals);
    }

    // Same as billing checkbox
    document.getElementById('sameAsBilling').addEventListener('change', handleSameAsBilling);

    // Form submit
    document.getElementById('checkoutForm').addEventListener('submit', handleSubmit);
}

// Handle customer type change (private/company)
function handleCustomerTypeChange(e) {
    const isCompany = e.target.value === 'company';
    document.getElementById('companySection').style.display = isCompany ? 'block' : 'none';

    // Update VAT display
    handleCountryChange();
}

// Handle country change
function handleCountryChange() {
    const country = document.getElementById('country').value;
    const customerType = document.querySelector('input[name="customerType"]:checked').value;
    const privateVatSection = document.getElementById('privateVatSection');

    // Show VAT option for private non-LU customers
    if (customerType === 'private' && country !== 'LU') {
        privateVatSection.style.display = 'block';
    } else {
        privateVatSection.style.display = 'none';
        document.getElementById('customerHandlesVat').checked = false;
    }

    updateTotals();
}

// Handle VAT number input - auto-fill company name and address
function handleVatNumberChange() {
    const vatNumber = document.getElementById('vatNumber').value.trim();
    const statusContainer = document.getElementById('vatStatus');

    if (!vatNumber) {
        statusContainer.innerHTML = '<span class="vat-badge pending">En attente</span>';
        updateTotals();
        return;
    }

    // Basic format validation
    const validation = validateVATFormat(vatNumber);

    if (!validation.valid) {
        statusContainer.innerHTML = '<span class="vat-badge invalid">Format invalide</span>';
        updateTotals();
        return;
    }

    // Show loading
    statusContainer.innerHTML = '<span class="vat-loading">Vérification...</span>';

    // Lookup company info from VAT number
    lookupVatNumber(vatNumber).then(result => {
        if (result.valid) {
            // Auto-fill company name
            if (result.name) {
                document.getElementById('companyName').value = result.name;
            }

            // Auto-fill address if available
            if (result.address) {
                const addressParts = parseVatAddress(result.address);
                if (addressParts.street) document.getElementById('address').value = addressParts.street;
                if (addressParts.postalCode) document.getElementById('postalCode').value = addressParts.postalCode;
                if (addressParts.city) document.getElementById('city').value = addressParts.city;
            }

            // Update country from VAT prefix
            if (validation.countryCode) {
                const countrySelect = document.getElementById('country');
                if ([...countrySelect.options].some(o => o.value === validation.countryCode)) {
                    countrySelect.value = validation.countryCode;
                    countrySelect.dispatchEvent(new Event('change'));
                }
            }

            // Show status
            if (validation.countryCode !== 'LU') {
                statusContainer.innerHTML = `
                    <span class="vat-badge reverse-charge">✓ Autoliquidation TVA</span>
                    <div class="vat-company-info">
                        <strong>${result.name || 'Société vérifiée'}</strong>
                    </div>
                `;
            } else {
                statusContainer.innerHTML = `
                    <span class="vat-badge valid">✓ TVA Luxembourg</span>
                    <div class="vat-company-info">
                        <strong>${result.name || 'Société vérifiée'}</strong>
                    </div>
                `;
            }
        } else {
            statusContainer.innerHTML = '<span class="vat-badge invalid">Numéro non valide</span>';
        }
        updateTotals();
    }).catch(() => {
        // If lookup fails, just validate format
        if (validation.countryCode !== 'LU') {
            statusContainer.innerHTML = '<span class="vat-badge reverse-charge">✓ Autoliquidation (format valide)</span>';
        } else {
            statusContainer.innerHTML = '<span class="vat-badge valid">✓ Format valide</span>';
        }
        updateTotals();
    });
}

// Lookup VAT number (mock for frontend, real validation needs backend/VIES API)
async function lookupVatNumber(vatNumber) {
    // In production, this would call a backend endpoint that uses VIES API
    // For demo, we simulate with mock data
    return new Promise((resolve) => {
        setTimeout(() => {
            const validation = validateVATFormat(vatNumber);
            if (validation.valid) {
                // Mock company data based on country
                const mockData = {
                    'FR': { name: 'Société Française SARL', address: '123 Rue de Paris, 75001 Paris' },
                    'BE': { name: 'Entreprise Belge SPRL', address: '45 Avenue Louise, 1050 Bruxelles' },
                    'DE': { name: 'Deutsche Firma GmbH', address: 'Hauptstraße 67, 10115 Berlin' },
                    'LU': { name: 'Luxembourg Company S.à r.l.', address: '12 Boulevard Royal, L-2449 Luxembourg' },
                };
                const countryData = mockData[validation.countryCode] || { name: 'Société', address: '' };
                resolve({ valid: true, ...countryData });
            } else {
                resolve({ valid: false });
            }
        }, 500);
    });
}

// Parse address from VAT lookup result
function parseVatAddress(address) {
    if (!address) return {};

    // Try to extract components (simple parsing)
    const parts = address.split(',').map(p => p.trim());

    if (parts.length >= 2) {
        const street = parts[0];
        const lastPart = parts[parts.length - 1];

        // Try to extract postal code and city
        const postalMatch = lastPart.match(/([A-Z]?-?\d{4,5})\s*(.+)?/);
        if (postalMatch) {
            return {
                street: street,
                postalCode: postalMatch[1].replace('-', ''),
                city: postalMatch[2] || parts[parts.length - 1]
            };
        }

        return { street: street, city: lastPart };
    }

    return { street: address };
}


// Update totals with VAT calculation
function updateTotals() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // Calculate subtotal HT
    // Price in cart is TTC with Luxembourg VAT, need to convert back to HT
    let subtotalTTC = cart.reduce((sum, item) => sum + (item.price || 0), 0);
    let subtotalHT = subtotalTTC / 1.17; // Remove Luxembourg VAT to get HT

    // Get customer info for VAT calculation
    const customerType = document.querySelector('input[name="customerType"]:checked')?.value || 'private';
    const country = document.getElementById('country')?.value || 'LU';
    const vatNumber = document.getElementById('vatNumber')?.value || '';
    const customerHandlesVat = document.getElementById('customerHandlesVat')?.checked || false;

    // Calculate VAT
    const customer = {
        country: country,
        vatNumber: customerType === 'company' ? vatNumber : '',
        customerType: customerType
    };

    const vatInfo = calculateVAT(subtotalHT, customer, { customerHandlesVat: customerHandlesVat });

    // Update display
    document.getElementById('subtotalHT').textContent = subtotalHT.toFixed(2).replace('.', ',') + ' €';
    document.getElementById('vatLabel').textContent = vatInfo.vatLabel;
    document.getElementById('vatAmount').textContent = vatInfo.vatAmount.toFixed(2).replace('.', ',') + ' €';
    document.getElementById('totalTTC').textContent = vatInfo.amountTTC.toFixed(2).replace('.', ',') + ' €';

    // Style VAT row based on type
    const vatRow = document.getElementById('vatRow');
    if (vatInfo.reverseCharge) {
        vatRow.style.background = '#e3f2fd';
        vatRow.style.padding = '10px';
        vatRow.style.borderRadius = '4px';
    } else if (vatInfo.customerResponsibility) {
        vatRow.style.background = '#fff3e0';
        vatRow.style.padding = '10px';
        vatRow.style.borderRadius = '4px';
    } else {
        vatRow.style.background = '';
        vatRow.style.padding = '';
    }

    // Store for later use
    window.currentVatInfo = vatInfo;
    window.currentSubtotalHT = subtotalHT;
}

// Handle same as billing checkbox
function handleSameAsBilling(e) {
    const shippingFields = document.getElementById('shippingAddressFields');
    if (e.target.checked) {
        shippingFields.style.display = 'none';
    } else {
        shippingFields.style.display = 'block';
    }
}


// Form submission
function handleSubmit(e) {
    e.preventDefault();

    // Validate required fields
    if (!document.getElementById('acceptTerms').checked) {
        alert('Veuillez accepter les Conditions Générales de Vente');
        return;
    }

    if (!document.getElementById('acceptQuality').checked) {
        alert('Veuillez accepter la clause concernant la qualité des fichiers');
        return;
    }

    // Collect form data
    const formData = new FormData(e.target);
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    const order = {
        id: 'ORD-' + Date.now(),
        orderNumber: 'OP-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6),
        createdAt: new Date().toISOString(),
        customer: {
            type: formData.get('customerType'),
            companyName: formData.get('companyName'),
            vatNumber: formData.get('vatNumber'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            postalCode: formData.get('postalCode'),
            city: formData.get('city'),
            country: formData.get('country'),
            customerHandlesVat: formData.get('customerHandlesVat') === 'on'
        },
        items: cart.map(item => ({
            name: item.name,
            details: item.details,
            quantity: item.quantity,
            priceHT: item.price / 1.17,
            priceTTC: item.price,
            supplierCost: item.supplierCost || 0,
            sku: item.sku,
            uploadedFile: item.uploadedFile
        })),
        totalHT: window.currentSubtotalHT,
        vatInfo: window.currentVatInfo,
        totalTTC: window.currentVatInfo.amountTTC,
        status: 'pending'
    };

    // Save order
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Clear cart
    localStorage.setItem('cart', '[]');

    // Redirect to payment (for now, show confirmation)
    // In production, this would redirect to Stripe
    alert(`Commande ${order.orderNumber} enregistrée!\n\nTotal: ${order.totalTTC.toFixed(2)} €\n\nRedirection vers le paiement...`);

    // For demo, redirect to confirmation
    window.location.href = `confirmation.html?order=${order.orderNumber}`;
}

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
