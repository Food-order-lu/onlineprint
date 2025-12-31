import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { status } = body

        const order = await prisma.order.update({
            where: { id: params.id },
            data: { status },
        })

        // Create audit log (simplified - would need actual user from session)
        await createAuditLog(
            'admin-user-id',
            'ORDER_STATUS_CHANGED',
            { newStatus: status },
            order.id
        )

        return NextResponse.json(order)
    } catch (error) {
        console.error('Error updating order status:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
