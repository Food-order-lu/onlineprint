// onlineprint.lu - VAT Calculation Utility

const VAT_RATES = {
    LU: 0.17,  // Luxembourg - default
    DE: 0.19,  // Germany
    FR: 0.20,  // France
    BE: 0.21,  // Belgium
    NL: 0.21,  // Netherlands
    AT: 0.20,  // Austria
    IT: 0.22,  // Italy
    ES: 0.21,  // Spain
    PT: 0.23,  // Portugal
};

// EU countries (for reverse charge eligibility)
const EU_COUNTRIES = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];

/**
 * Calculate VAT for an order
 * @param {number} amountHT - Amount before tax
 * @param {object} customer - Customer object with country, vatNumber, and customerType
 * @param {object} options - { customerHandlesVat: boolean } for private customers
 * @returns {object} - { vatRate, vatAmount, amountTTC, reverseCharge, vatLabel, customerResponsibility }
 */
function calculateVAT(amountHT, customer = {}, options = {}) {
    const sellerCountry = 'LU'; // onlineprint.lu is based in Luxembourg
    const customerCountry = customer.country || 'LU';
    const customerVatNumber = customer.vatNumber || '';
    const isB2B = !!customerVatNumber && customerVatNumber.length >= 8;
    const customerType = customer.customerType || (isB2B ? 'company' : 'private');

    let vatRate = VAT_RATES.LU; // Default Luxembourg rate
    let reverseCharge = false;
    let vatLabel = 'TVA Luxembourg 17%';
    let customerResponsibility = false;

    // Case 1: B2B intra-EU with valid VAT number = Reverse charge (autoliquidation)
    if (isB2B && EU_COUNTRIES.includes(customerCountry) && customerCountry !== sellerCountry) {
        vatRate = 0;
        reverseCharge = true;
        vatLabel = 'Autoliquidation TVA (0%) - Art. 44 Dir. 2006/112/CE';
    }
    // Case 2: Customer in Luxembourg = Always Luxembourg VAT
    else if (customerCountry === sellerCountry) {
        vatRate = VAT_RATES.LU;
        vatLabel = 'TVA Luxembourg 17%';
    }
    // Case 3: Private customer in another EU country
    // By default we apply Luxembourg VAT, but customer can choose to handle it themselves
    else if (EU_COUNTRIES.includes(customerCountry) && customerType === 'private') {
        if (options.customerHandlesVat) {
            // Customer takes responsibility for VAT in their country
            vatRate = 0;
            vatLabel = 'TVA à déclarer par le client';
            customerResponsibility = true;
        } else {
            // Default: Luxembourg VAT applies
            vatRate = VAT_RATES.LU;
            vatLabel = 'TVA Luxembourg 17%';
        }
    }
    // Case 4: Non-EU = Export, no VAT
    else if (!EU_COUNTRIES.includes(customerCountry)) {
        vatRate = 0;
        reverseCharge = false;
        vatLabel = 'Export hors UE (0%)';
    }

    const vatAmount = amountHT * vatRate;
    const amountTTC = amountHT + vatAmount;

    return {
        vatRate,
        vatPercent: vatRate * 100,
        vatAmount,
        amountTTC,
        reverseCharge,
        vatLabel,
        customerResponsibility
    };
}

/**
 * Validate EU VAT number format (basic check)
 * Full validation requires VIES API (server-side)
 * @param {string} vatNumber 
 * @returns {object} - { valid, countryCode, number }
 */
function validateVATFormat(vatNumber) {
    if (!vatNumber || vatNumber.length < 8) {
        return { valid: false, countryCode: null, number: null };
    }

    const cleaned = vatNumber.replace(/\s/g, '').toUpperCase();
    const countryCode = cleaned.substring(0, 2);
    const number = cleaned.substring(2);

    if (!EU_COUNTRIES.includes(countryCode)) {
        return { valid: false, countryCode: null, number: null };
    }

    return { valid: true, countryCode, number: cleaned };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateVAT, validateVATFormat, VAT_RATES, EU_COUNTRIES };
}
