import { prisma } from './prisma'

interface PriceCalculation {
    quantity: number
    unitPriceHT: number
    subtotalHT: number
    vatAmount: number
    vatRate: number
    total: number
    marginPercent: number
    profitHT: number
}

/**
 * Calculate pricing for a product variant based on quantity
 */
export async function calculatePrice(
    variantId: string,
    quantity: number,
    vatRate: number = 20
): Promise<PriceCalculation | null> {
    // Get variant with pricing tiers
    const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: {
            pricingTiers: {
                orderBy: { minQuantity: 'asc' },
            },
        },
    })

    if (!variant) return null

    // Find applicable pricing tier
    const tier = variant.pricingTiers.find(
        (t) => quantity >= t.minQuantity && (!t.maxQuantity || quantity <= t.maxQuantity)
    )

    if (!tier) {
        // Fallback to base cost if no tier matches
        const unitPriceHT = variant.baseCost * 1.5 // Default 50% margin
        const subtotalHT = unitPriceHT * quantity
        const vatAmount = (subtotalHT * vatRate) / 100
        const total = subtotalHT + vatAmount

        return {
            quantity,
            unitPriceHT,
            subtotalHT,
            vatAmount,
            vatRate,
            total,
            marginPercent: 50,
            profitHT: subtotalHT - (variant.baseCost * quantity),
        }
    }

    // Calculate price from tier
    let unitPriceHT: number
    let marginPercent: number

    if (tier.sellingPrice !== null) {
        // Use override selling price
        unitPriceHT = tier.sellingPrice
        marginPercent = ((unitPriceHT - tier.supplierCost) / tier.supplierCost) * 100
    } else if (tier.marginPercent !== null) {
        // Calculate from margin
        marginPercent = tier.marginPercent
        unitPriceHT = tier.supplierCost * (1 + marginPercent / 100)
    } else {
        // Default margin 40%
        marginPercent = 40
        unitPriceHT = tier.supplierCost * 1.4
    }

    const subtotalHT = unitPriceHT * quantity
    const vatAmount = (subtotalHT * vatRate) / 100
    const total = subtotalHT + vatAmount
    const profitHT = subtotalHT - (tier.supplierCost * quantity)

    return {
        quantity,
        unitPriceHT: Math.round(unitPriceHT * 100) / 100,
        subtotalHT: Math.round(subtotalHT * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        vatRate,
        total: Math.round(total * 100) / 100,
        marginPercent: Math.round(marginPercent * 10) / 10,
        profitHT: Math.round(profitHT * 100) / 100,
    }
}

/**
 * Get available quantity tiers for a variant
 */
export async function getQuantityTiers(variantId: string) {
    const tiers = await prisma.pricingTier.findMany({
        where: { variantId },
        orderBy: { minQuantity: 'asc' },
    })

    return tiers.map((tier) => ({
        minQuantity: tier.minQuantity,
        maxQuantity: tier.maxQuantity,
        label: tier.maxQuantity
            ? `${tier.minQuantity} - ${tier.maxQuantity}`
            : `${tier.minQuantity}+`,
    }))
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency,
    }).format(amount)
}

/**
 * Calculate order totals from items
 */
export function calculateOrderTotals(
    items: Array<{ unitPriceHT: number; quantity: number }>,
    shippingCost: number = 0,
    vatRate: number = 20
) {
    const subtotalHT = items.reduce((sum, item) => sum + item.unitPriceHT * item.quantity, 0)
    const vatAmount = ((subtotalHT + shippingCost) * vatRate) / 100
    const total = subtotalHT + shippingCost + vatAmount

    return {
        subtotalHT: Math.round(subtotalHT * 100) / 100,
        shippingCost: Math.round(shippingCost * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
    }
}
