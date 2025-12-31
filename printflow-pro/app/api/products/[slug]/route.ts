import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const product = await prisma.product.findUnique({
            where: { slug: params.slug },
            include: {
                category: true,
                variants: {
                    where: { active: true },
                    include: {
                        pricingTiers: {
                            orderBy: { minQuantity: 'asc' },
                        },
                    },
                },
            },
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        // Get unique pricing tiers
        const allTiers = product.variants.flatMap((v) => v.pricingTiers)
        const uniqueQuantities = [...new Set(allTiers.map((t) => t.minQuantity))].sort((a, b) => a - b)

        const pricingTiers = uniqueQuantities.map((qty) => ({
            minQuantity: qty,
            maxQuantity: allTiers.find((t) => t.minQuantity === qty)?.maxQuantity,
        }))

        return NextResponse.json({
            product: {
                id: product.id,
                name: product.name,
                slug: product.slug,
                description: product.description,
            },
            variants: product.variants,
            pricingTiers,
        })
    } catch (error) {
        console.error('Error fetching product:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
