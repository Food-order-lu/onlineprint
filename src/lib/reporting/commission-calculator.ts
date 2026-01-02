/**
 * Commission Calculator
 * Handles the logic for Rivego's commission models:
 * 1. Legacy: Fixed % of turnover OR Fixed Amount
 * 2. New (Hybrid): Fixed fee (60€) if turnover < threshold (1000€), otherwise %
 */

interface CommissionConfig {
    type: 'legacy_percent' | 'legacy_fixed' | 'hybrid';
    base_fee?: number;        // e.g., 60.0
    percent?: number;         // e.g., 7.0
    threshold?: number;       // e.g., 1000.0
    fixed_amount?: number;    // e.g., 100.0 (Legacy fixed)
}

interface CalculationResult {
    commission_amount: number;
    commission_type: 'fixed' | 'percentage';
    base_turnover: number;
    effective_rate?: number;
    description: string;
}

export function calculateCommission(
    turnover: number,
    config: CommissionConfig
): CalculationResult {
    // SCENARIO 1: Legacy Fixed Amount
    if (config.type === 'legacy_fixed') {
        const amount = config.fixed_amount || 0;
        return {
            commission_amount: amount,
            commission_type: 'fixed',
            base_turnover: turnover,
            description: `Forfait fixe (Ancien modèle)`
        };
    }

    // SCENARIO 2: Legacy Percentage
    if (config.type === 'legacy_percent') {
        const rate = config.percent || 7.0;
        return {
            commission_amount: Number((turnover * (rate / 100)).toFixed(2)),
            commission_type: 'percentage',
            base_turnover: turnover,
            effective_rate: rate,
            description: `Commission standard ${rate}%`
        };
    }

    // SCENARIO 3: New Hybrid Model
    // 60€ fixed if < threshold, else %
    const threshold = config.threshold || 1000.0;
    const baseFee = config.base_fee || 60.0;
    const rate = config.percent || 7.0;

    if (turnover < threshold) {
        return {
            commission_amount: baseFee,
            commission_type: 'fixed',
            base_turnover: turnover,
            description: `Forfait minimum (CA < ${threshold}€)`
        };
    }

    return {
        commission_amount: Number((turnover * (rate / 100)).toFixed(2)),
        commission_type: 'percentage',
        base_turnover: turnover,
        effective_rate: rate,
        description: `Commission sur CA (${rate}%)`
    };
}
