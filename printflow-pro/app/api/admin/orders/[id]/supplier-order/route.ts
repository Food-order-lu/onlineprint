import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { supplierName, supplierRef } = body

        const supplierOrder = await prisma.supplierOrder.create({
            data: {
                orderId: params.id,
                supplierName,
                supplierRef,
                createdBy: 'admin-user-id', // Would come from session
            },
        })

        return NextResponse.json(supplierOrder)
    } catch (error) {
        console.error('Error creating supplier order:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
