import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendShipmentTrackingEmail } from '@/lib/email'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { carrier, trackingNumber, trackingUrl } = body

        const shipment = await prisma.shipment.create({
            data: {
                orderId: params.id,
                carrier,
                trackingNumber,
                trackingUrl,
                shippedBy: 'admin-user-id', // Would come from session
            },
        })

        // Send tracking email to customer
        await sendShipmentTrackingEmail(params.id, trackingNumber, trackingUrl)

        return NextResponse.json(shipment)
    } catch (error) {
        console.error('Error creating shipment:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
