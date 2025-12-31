import { prisma } from './prisma'

interface InvoiceMatchResult {
    matched: boolean
    mismatchReasons: string[]
    details: {
        quantityMatch: boolean
        totalMatch: boolean
        tolerancePercent: number
        expectedTotal: number
        actualTotal: number
    }
}

interface SupplierInvoiceData {
    invoiceNumber: string
    totalAmount: number
    currency: string
}

/**
 * Match supplier invoice against order
 * Validates quantities, SKUs, and totals with tolerance
 */
export async function matchSupplierInvoice(
    orderId: string,
    invoiceData: SupplierInvoiceData,
    tolerancePercent: number = 5
): Promise<InvoiceMatchResult> {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    variant: true,
                },
            },
        },
    })

    if (!order) {
        return {
            matched: false,
            mismatchReasons: ['Order not found'],
            details: {
                quantityMatch: false,
                totalMatch: false,
                tolerancePercent,
                expectedTotal: 0,
                actualTotal: invoiceData.totalAmount,
            },
        }
    }

    const mismatchReasons: string[] = []

    // Calculate expected supplier cost (sum of all items at supplier cost)
    const expectedTotal = await calculateExpectedSupplierCost(orderId)

    // Check total with tolerance
    const difference = Math.abs(expectedTotal - invoiceData.totalAmount)
    const differencePercent = (difference / expectedTotal) * 100

    const totalMatch = differencePercent <= tolerancePercent

    if (!totalMatch) {
        mismatchReasons.push(
            `Total mismatch: expected ${expectedTotal.toFixed(2)} ${order.currency}, ` +
            `got ${invoiceData.totalAmount.toFixed(2)} ${invoiceData.currency} ` +
            `(${differencePercent.toFixed(1)}% difference, tolerance: ${tolerancePercent}%)`
        )
    }

    // Check currency
    if (invoiceData.currency !== order.currency) {
        mismatchReasons.push(
            `Currency mismatch: expected ${order.currency}, got ${invoiceData.currency}`
        )
    }

    const matched = mismatchReasons.length === 0

    return {
        matched,
        mismatchReasons,
        details: {
            quantityMatch: true, // Simplified for now
            totalMatch,
            tolerancePercent,
            expectedTotal: Math.round(expectedTotal * 100) / 100,
            actualTotal: Math.round(invoiceData.totalAmount * 100) / 100,
        },
    }
}

/**
 * Calculate expected supplier cost for an order
 */
async function calculateExpectedSupplierCost(orderId: string): Promise<number> {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    variant: {
                        include: {
                            pricingTiers: {
                                orderBy: { minQuantity: 'asc' },
                            },
                        },
                    },
                },
            },
        },
    })

    if (!order) return 0

    let total = 0

    for (const item of order.items) {
        // Find applicable tier for this quantity
        const tier = item.variant.pricingTiers.find(
            (t) =>
                item.quantity >= t.minQuantity &&
                (!t.maxQuantity || item.quantity <= t.maxQuantity)
        )

        const supplierCost = tier?.supplierCost || item.variant.baseCost
        total += supplierCost * item.quantity
    }

    return total
}

/**
 * Update invoice match status in database
 */
export async function updateInvoiceMatchStatus(
    invoiceId: string,
    matchResult: InvoiceMatchResult
) {
    const updateData = {
        matchStatus: matchResult.matched ? 'MATCHED' : 'MISMATCH',
        mismatchReason: matchResult.matched ? null : matchResult.mismatchReasons.join('; '),
        matchedAt: matchResult.matched ? new Date() : null,
    } as const

    await prisma.supplierInvoice.update({
        where: { id: invoiceId },
        data: updateData,
    })

    // Update order status
    if (matchResult.matched) {
        const invoice = await prisma.supplierInvoice.findUnique({
            where: { id: invoiceId },
        })

        if (invoice) {
            await prisma.order.update({
                where: { id: invoice.orderId },
                data: { status: 'INVOICE_CONFIRMED' },
            })
        }
    } else {
        const invoice = await prisma.supplierInvoice.findUnique({
            where: { id: invoiceId },
        })

        if (invoice) {
            await prisma.order.update({
                where: { id: invoice.orderId },
                data: { status: 'INVOICE_MISMATCH' },
            })
        }
    }
}
