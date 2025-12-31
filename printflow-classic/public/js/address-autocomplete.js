// onlineprint.lu - Address Autocomplete
// Uses OpenStreetMap Nominatim API (free, no API key required)

class AddressAutocomplete {
    constructor(inputId, options = {}) {
        this.input = document.getElementById(inputId);
        if (!this.input) return;

        this.options = {
            onSelect: options.onSelect || null,
            countries: options.countries || ['lu', 'be', 'fr', 'de', 'nl', 'at', 'it', 'es', 'ch'],
            minLength: options.minLength || 3,
            delay: options.delay || 300
        };

        this.results = [];
        this.selectedIndex = -1;
        this.debounceTimer = null;

        this.init();
    }

    init() {
        // Create dropdown container
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'address-autocomplete-dropdown';
        this.dropdown.style.display = 'none';
        this.input.parentNode.style.position = 'relative';
        this.input.parentNode.appendChild(this.dropdown);

        // Add input event listeners
        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.input.addEventListener('blur', () => setTimeout(() => this.hideDropdown(), 200));
        this.input.addEventListener('focus', () => {
            if (this.results.length > 0) this.showDropdown();
        });

        // Add placeholder hint
        this.input.placeholder = this.input.placeholder || 'Commencez à taper pour rechercher...';
    }

    handleInput() {
        clearTimeout(this.debounceTimer);
        const query = this.input.value.trim();

        if (query.length < this.options.minLength) {
            this.hideDropdown();
            return;
        }

        this.debounceTimer = setTimeout(() => this.search(query), this.options.delay);
    }

    async search(query) {
        try {
            // Use Nominatim API
            const countryCodes = this.options.countries.join(',');
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=${countryCodes}&addressdetails=1&limit=5`;

            const response = await fetch(url, {
                headers: {
                    'Accept-Language': 'fr',
                    'User-Agent': 'onlineprint.lu-checkout'
                }
            });

            if (!response.ok) throw new Error('Search failed');

            this.results = await response.json();
            this.renderResults();
        } catch (error) {
            console.error('Address search error:', error);
            this.results = [];
            this.hideDropdown();
        }
    }

    renderResults() {
        if (this.results.length === 0) {
            this.dropdown.innerHTML = '<div class="autocomplete-no-results">Aucun résultat trouvé</div>';
            this.showDropdown();
            return;
        }

        this.dropdown.innerHTML = this.results.map((result, index) => {
            const addr = result.address || {};
            return `
                <div class="autocomplete-item" data-index="${index}">
                    <div class="autocomplete-main">${result.display_name.split(',').slice(0, 2).join(',')}</div>
                    <div class="autocomplete-secondary">${result.display_name.split(',').slice(2).join(',')}</div>
                </div>
            `;
        }).join('');

        // Add click handlers
        this.dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.selectResult(index);
            });
        });

        this.showDropdown();
    }

    selectResult(index) {
        const result = this.results[index];
        if (!result) return;

        const addr = result.address || {};

        // Parse address components
        const addressData = {
            street: this.buildStreet(addr),
            postalCode: addr.postcode || '',
            city: addr.city || addr.town || addr.village || addr.municipality || '',
            country: this.getCountryCode(addr.country_code),
            raw: result
        };

        // Update input with street
        this.input.value = addressData.street;

        // Call onSelect callback if provided
        if (this.options.onSelect) {
            this.options.onSelect(addressData);
        }

        this.hideDropdown();
    }

    buildStreet(addr) {
        const parts = [];
        if (addr.road) parts.push(addr.road);
        if (addr.house_number) parts.push(addr.house_number);
        return parts.join(' ') || '';
    }

    getCountryCode(code) {
        const map = {
            'lu': 'LU', 'be': 'BE', 'fr': 'FR', 'de': 'DE',
            'nl': 'NL', 'at': 'AT', 'it': 'IT', 'es': 'ES',
            'ch': 'CH', 'pt': 'PT', 'gb': 'UK'
        };
        return map[code?.toLowerCase()] || code?.toUpperCase() || '';
    }

    handleKeydown(e) {
        if (!this.dropdown.style.display || this.dropdown.style.display === 'none') return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
                this.highlightItem();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.highlightItem();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectResult(this.selectedIndex);
                }
                break;
            case 'Escape':
                this.hideDropdown();
                break;
        }
    }

    highlightItem() {
        this.dropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
            item.classList.toggle('highlighted', index === this.selectedIndex);
        });
    }

    showDropdown() {
        this.dropdown.style.display = 'block';
    }

    hideDropdown() {
        this.dropdown.style.display = 'none';
        this.selectedIndex = -1;
    }
}

// Initialize address autocomplete on checkout page
document.addEventListener('DOMContentLoaded', function () {
    // Billing address autocomplete
    const billingAutocomplete = new AddressAutocomplete('address', {
        onSelect: (data) => {
            document.getElementById('postalCode').value = data.postalCode;
            document.getElementById('city').value = data.city;
            if (data.country) {
                document.getElementById('country').value = data.country;
                // Trigger change event for VAT calculation
                document.getElementById('country').dispatchEvent(new Event('change'));
            }
        }
    });

    // Watch for shipping address fields being added
    const observer = new MutationObserver(() => {
        const shippingAddress = document.getElementById('shippingAddress');
        if (shippingAddress && !shippingAddress._autocompleteInit) {
            shippingAddress._autocompleteInit = true;
            new AddressAutocomplete('shippingAddress', {
                onSelect: (data) => {
                    const shippingPostal = document.getElementById('shippingPostalCode');
                    const shippingCity = document.getElementById('shippingCity');
                    const shippingCountry = document.getElementById('shippingCountry');

                    if (shippingPostal) shippingPostal.value = data.postalCode;
                    if (shippingCity) shippingCity.value = data.city;
                    if (shippingCountry && data.country) shippingCountry.value = data.country;
                }
            });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
