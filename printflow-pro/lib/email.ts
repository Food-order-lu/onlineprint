import { prisma } from './prisma'
import { EmailType, EmailStatus } from '@prisma/client'
import nodemailer from 'nodemailer'

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: process.env.EMAIL_USER
        ? {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        }
        : undefined,
})

/**
 * Replace template variables with actual values
 */
function replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g')
        result = result.replace(regex, String(value || ''))
    }
    return result
}

/**
 * Send an email using a template
 */
export async function sendEmail(
    emailType: EmailType,
    recipient: string,
    variables: Record<string, any>,
    orderId?: string
): Promise<boolean> {
    try {
        // Get template
        const template = await prisma.emailTemplate.findUnique({
            where: { type: emailType },
        })

        if (!template || !template.active) {
            console.error(`Email template ${emailType} not found or inactive`)
            return false
        }

        // Replace variables
        const subject = replaceVariables(template.subject, variables)
        const bodyHtml = replaceVariables(template.bodyHtml, variables)

        // Send email
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'noreply@printflow-pro.com',
            to: recipient,
            subject,
            html: bodyHtml,
        })

        // Log email
        await prisma.emailLog.create({
            data: {
                orderId,
                emailType,
                recipient,
                subject,
                bodyHtml,
                status: EmailStatus.SENT,
                sentAt: new Date(),
            },
        })

        console.log('Email sent:', info.messageId)
        return true
    } catch (error) {
        console.error('Error sending email:', error)

        // Log failed email
        await prisma.emailLog.create({
            data: {
                orderId,
                emailType,
                recipient,
                subject: `[FAILED] ${emailType}`,
                bodyHtml: '',
                status: EmailStatus.FAILED,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
        })

        return false
    }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(orderId: string) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
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
        },
    })

    if (!order) return false

    const variables = {
        customer_name: order.user.name || 'Client',
        order_number: order.orderNumber,
        order_total: `${order.total.toFixed(2)} €`,
        order_date: new Date(order.createdAt).toLocaleDateString('fr-FR'),
        order_url: `${process.env.NEXTAUTH_URL}/account/orders/${order.id}`,
    }

    return sendEmail(EmailType.ORDER_CONFIRMATION, order.user.email, variables, order.id)
}

/**
 * Send shipment tracking email
 */
export async function sendShipmentTrackingEmail(orderId: string, trackingNumber: string, trackingUrl?: string) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
    })

    if (!order) return false

    const variables = {
        customer_name: order.user.name || 'Client',
        order_number: order.orderNumber,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl || '#',
        carrier: 'GLS',
    }

    return sendEmail(EmailType.SHIPMENT_TRACKING, order.user.email, variables, order.id)
}

/**
 * Send files issue notification email
 */
export async function sendFilesIssueEmail(orderId: string, issueDescription: string) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
    })

    if (!order) return false

    const variables = {
        customer_name: order.user.name || 'Client',
        order_number: order.orderNumber,
        issue_description: issueDescription,
        order_url: `${process.env.NEXTAUTH_URL}/account/orders/${order.id}`,
    }

    return sendEmail(EmailType.FILES_ISSUE, order.user.email, variables, order.id)
}
