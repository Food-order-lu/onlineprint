/**
 * VAT Calculator
 * Logic for Rivego's VAT rules:
 * 1. Luxembourg Company: 17%
 * 2. EU Company (Non-LU) with Valid VAT: 0% (Auto-liquidation)
 * 3. Private Individual: 17% (Luxembourg VAT applies)
 */

export interface VatConfig {
    country_code: string; // e.g., 'LU', 'FR', 'BE'
    is_company: boolean;  // true for B2B, false for B2C
    vat_number?: string;  // Required for Auto-liquidation check
}

export interface VatResult {
    rate: number;         // e.g., 17.0 or 0.0
    amount: number;
    mode: 'luxembourg' | 'auto_liquidation' | 'private_individual';
    notes?: string;
}

export function calculateVat(
    amount: number,
    config: VatConfig
): VatResult {
    // SCENARIO 1: Private Individual (Always LU VAT)
    if (!config.is_company) {
        return {
            rate: 17.0,
            amount: Number((amount * 0.17).toFixed(2)),
            mode: 'private_individual',
            notes: 'TVA Luxembourg (Client Particulier)'
        };
    }

    // SCENARIO 2: Luxembourg Company (Always LU VAT)
    if (config.country_code.toUpperCase() === 'LU') {
        return {
            rate: 17.0,
            amount: Number((amount * 0.17).toFixed(2)),
            mode: 'luxembourg',
            notes: 'TVA Luxembourg (Entité LU)'
        };
    }

    // SCENARIO 3: EU Company (Auto-liquidation)
    // Assumption: If they have a VAT number and are not in LU, it's auto-liquidation.
    // Ideally, we verify the VAT number via VIES API here.
    if (config.vat_number && config.country_code.toUpperCase() !== 'LU') {
        return {
            rate: 0.0,
            amount: 0.0,
            mode: 'auto_liquidation',
            notes: 'Autoliquidation (Art. 196 Directive TVA)'
        };
    }

    // Fallback: Default to LU VAT if unsure
    return {
        rate: 17.0,
        amount: Number((amount * 0.17).toFixed(2)),
        mode: 'luxembourg',
        notes: 'TVA Luxembourg (Défaut)'
    };
}
