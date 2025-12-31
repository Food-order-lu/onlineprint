import { prisma } from './prisma'

export async function createAuditLog(
    userId: string,
    action: string,
    details?: Record<string, any>,
    orderId?: string,
    request?: Request
) {
    const ipAddress = request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || null
    const userAgent = request?.headers.get('user-agent') || null

    await prisma.auditLog.create({
        data: {
            userId,
            action,
            details: details ? JSON.stringify(details) : null,
            orderId,
            ipAddress,
            userAgent,
        },
    })
}

export async function getAuditLogsForOrder(orderId: string) {
    return prisma.auditLog.findMany({
        where: { orderId },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
    })
}
