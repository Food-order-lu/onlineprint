import { NextResponse } from 'next/server'
import { calculatePrice } from '@/lib/pricing'

export async function POST(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const body = await request.json()
        const { variantId, quantity } = body

        if (!variantId || !quantity) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const price = await calculatePrice(variantId, quantity)

        if (!price) {
            return NextResponse.json({ error: 'Unable to calculate price' }, { status: 400 })
        }

        return NextResponse.json({ price })
    } catch (error) {
        console.error('Error calculating price:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
