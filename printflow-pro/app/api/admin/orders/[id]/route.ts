import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: params.id },
            include: {
                user: true,
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
                billingAddress: true,
                shippingAddress: true,
                supplierOrder: true,
                supplierInvoice: true,
                shipment: true,
            },
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        return NextResponse.json(order)
    } catch (error) {
        console.error('Error fetching order:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
