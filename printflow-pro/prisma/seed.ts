import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Clear existing data
    await prisma.auditLog.deleteMany()
    await prisma.emailLog.deleteMany()
    await prisma.shipment.deleteMany()
    await prisma.supplierInvoice.deleteMany()
    await prisma.supplierOrder.deleteMany()
    await prisma.orderFile.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.cartItem.deleteMany()
    await prisma.cart.deleteMany()
    await prisma.address.deleteMany()
    await prisma.pricingTier.deleteMany()
    await prisma.productVariant.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.emailTemplate.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()

    // Create Users
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@printflow.com',
            password: hashedPassword,
            name: 'Admin PrintFlow',
            role: 'ADMIN',
        },
    })

    const customerUser = await prisma.user.create({
        data: {
            email: 'client@example.com',
            password: await bcrypt.hash('client123', 10),
            name: 'Jean Dupont',
            role: 'CUSTOMER',
            companyName: 'Startup Tech',
        },
    })

    console.log('✅ Users created')

    // Create Categories
    const categoriesData = [
        { name: 'Cartes de visite', slug: 'cartes-visite', icon: '💼', sortOrder: 1 },
        { name: 'Flyers', slug: 'flyers', icon: '📄', sortOrder: 2 },
        { name: 'Affiches', slug: 'affiches', icon: '🖼️', sortOrder: 3 },
        { name: 'Dépliants', slug: 'depliants', icon: '📑', sortOrder: 4 },
    ]

    const categories = await Promise.all(
        categoriesData.map((cat) =>
            prisma.category.create({ data: cat })
        )
    )

    console.log('✅ Categories created')

    // Create Products with Variants

    // 1. CARTES DE VISITE
    const cartesVisite = await prisma.product.create({
        data: {
            name: 'Cartes de Visite Premium',
            slug: 'cartes-visite-premium',
            description: 'Cartes de visite professionnelles haute qualité, plusieurs formats et finitions disponibles',
            categoryId: categories[0].id,
            active: true,
            sortOrder: 1,
        },
    })

    const carteVariants = [
        { format: '85x55mm', paper: '350g', type: 'Couché mat', sides: 'RECTO', finish: null },
        { format: '85x55mm', paper: '350g', type: 'Couché mat', sides: 'RECTO_VERSO', finish: null },
        { format: '85x55mm', paper: '350g', type: 'Couché mat', sides: 'RECTO', finish: 'Pelliculage mat' },
        { format: '85x55mm', paper: '350g', type: 'Couché mat', sides: 'RECTO_VERSO', finish: 'Pelliculage mat' },
        { format: '85x55mm', paper: '400g', type: 'Couché brillant', sides: 'RECTO_VERSO', finish: 'Pelliculage brillant' },
    ]

    for (const [index, variantData] of carteVariants.entries()) {
        const variant = await prisma.productVariant.create({
            data: {
                productId: cartesVisite.id,
                sku: `CV-${index + 1}`,
                format: variantData.format,
                paperWeight: variantData.paper,
                paperType: variantData.type,
                printSides: variantData.sides,
                finish: variantData.finish,
                baseCost: 8.50,
                leadTimeDays: 5,
                currency: 'EUR',
                active: true,
            },
        })

        // Pricing tiers for business cards
        const tiers = [
            { min: 50, max: 99, cost: 8.50, margin: 50 },
            { min: 100, max: 249, cost: 7.20, margin: 55 },
            { min: 250, max: 499, cost: 5.80, margin: 60 },
            { min: 500, max: 999, cost: 4.50, margin: 65 },
            { min: 1000, max: 2499, cost: 3.20, margin: 70 },
            { min: 2500, max: null, cost: 2.50, margin: 75 },
        ]

        for (const tier of tiers) {
            await prisma.pricingTier.create({
                data: {
                    variantId: variant.id,
                    minQuantity: tier.min,
                    maxQuantity: tier.max,
                    supplierCost: tier.cost,
                    marginPercent: tier.margin,
                },
            })
        }
    }

    console.log('✅ Business cards created with variants and pricing')

    // 2. FLYERS
    const flyers = await prisma.product.create({
        data: {
            name: 'Flyers A5',
            slug: 'flyers-a5',
            description: 'Flyers A5 pour vos communications marketing, papier couché de qualité',
            categoryId: categories[1].id,
            active: true,
            sortOrder: 2,
        },
    })

    const flyerVariants = [
        { format: 'A6', paper: '170g', type: 'Couché brillant', sides: 'RECTO', finish: null },
        { format: 'A6', paper: '170g', type: 'Couché brillant', sides: 'RECTO_VERSO', finish: null },
        { format: 'A5', paper: '170g', type: 'Couché brillant', sides: 'RECTO', finish: null },
        { format: 'A5', paper: '170g', type: 'Couché brillant', sides: 'RECTO_VERSO', finish: null },
        { format: 'A5', paper: '250g', type: 'Couché mat', sides: 'RECTO_VERSO', finish: null },
        { format: 'A4', paper: '170g', type: 'Couché brillant', sides: 'RECTO_VERSO', finish: null },
    ]

    for (const [index, variantData] of flyerVariants.entries()) {
        const variant = await prisma.productVariant.create({
            data: {
                productId: flyers.id,
                sku: `FLY-${index + 1}`,
                format: variantData.format,
                paperWeight: variantData.paper,
                paperType: variantData.type,
                printSides: variantData.sides,
                finish: variantData.finish,
                baseCost: 15.00,
                leadTimeDays: 4,
                currency: 'EUR',
                active: true,
            },
        })

        // Pricing tiers for flyers
        const tiers = [
            { min: 100, max: 249, cost: 15.00, margin: 45 },
            { min: 250, max: 499, cost: 12.50, margin: 50 },
            { min: 500, max: 999, cost: 10.00, margin: 55 },
            { min: 1000, max: 2499, cost: 7.50, margin: 60 },
            { min: 2500, max: 4999, cost: 5.50, margin: 65 },
            { min: 5000, max: null, cost: 4.00, margin: 70 },
        ]

        for (const tier of tiers) {
            await prisma.pricingTier.create({
                data: {
                    variantId: variant.id,
                    minQuantity: tier.min,
                    maxQuantity: tier.max,
                    supplierCost: tier.cost,
                    marginPercent: tier.margin,
                },
            })
        }
    }

    console.log('✅ Flyers created with variants and pricing')

    // Create Email Templates
    const templates = [
        {
            type: 'ORDER_CONFIRMATION',
            subject: 'Confirmation de votre commande {{order_number}}',
            bodyHtml: `
        <h1>Merci pour votre commande !</h1>
        <p>Bonjour {{customer_name}},</p>
        <p>Nous avons bien reçu votre commande <strong>{{order_number}}</strong> d'un montant de <strong>{{order_total}}</strong>.</p>
        <p>Nous allons vérifier vos fichiers et vous tiendrons informé de l'avancement de votre commande.</p>
        <p><a href="{{order_url}}">Voir ma commande</a></p>
        <p>Cordialement,<br>L'équipe PrintFlow Pro</p>
      `,
            variables: JSON.stringify(['customer_name', 'order_number', 'order_total', 'order_url']),
        },
        {
            type: 'FILES_ISSUE',
            subject: 'Action requise : problème avec vos fichiers - {{order_number}}',
            bodyHtml: `
        <h1>Action requise pour votre commande</h1>
        <p>Bonjour {{customer_name}},</p>
        <p>Nous avons détecté un problème avec les fichiers de votre commande <strong>{{order_number}}</strong> :</p>
        <p><em>{{issue_description}}</em></p>
        <p>Merci de télécharger de nouveaux fichiers corrigés via votre espace client.</p>
        <p><a href="{{order_url}}">Voir ma commande et uploader de nouveaux fichiers</a></p>
        <p>Cordialement,<br>L'équipe PrintFlow Pro</p>
      `,
            variables: JSON.stringify(['customer_name', 'order_number', 'issue_description', 'order_url']),
        },
        {
            type: 'SHIPMENT_TRACKING',
            subject: 'Votre commande {{order_number}} est en route !',
            bodyHtml: `
        <h1>Votre commande est expédiée ! 📦</h1>
        <p>Bonjour {{customer_name}},</p>
        <p>Bonne nouvelle ! Votre commande <strong>{{order_number}}</strong> a été expédiée.</p>
        <p><strong>Transporteur :</strong> {{carrier}}<br>
        <strong>Numéro de tracking :</strong> {{tracking_number}}</p>
        <p><a href="{{tracking_url}}">Suivre mon colis</a></p>
        <p>Merci de votre confiance !<br>L'équipe PrintFlow Pro</p>
      `,
            variables: JSON.stringify(['customer_name', 'order_number', 'carrier', 'tracking_number', 'tracking_url']),
        },
    ]

    for (const template of templates) {
        await prisma.emailTemplate.create({ data: template as any })
    }

    console.log('✅ Email templates created')

    // Create sample address for customer
    const address = await prisma.address.create({
        data: {
            userId: customerUser.id,
            type: 'BILLING',
            isDefault: true,
            firstName: 'Jean',
            lastName: 'Dupont',
            company: 'Startup Tech',
            address1: '123 Rue de la Tech',
            city: 'Paris',
            postalCode: '75001',
            country: 'FR',
            phone: '+33 1 23 45 67 89',
        },
    })

    // Create sample order
    const order = await prisma.order.create({
        data: {
            orderNumber: 'PFP-2025-0001',
            userId: customerUser.id,
            status: 'NEW',
            paymentStatus: 'PAID',
            billingAddressId: address.id,
            shippingAddressId: address.id,
            subtotalHT: 41.67,
            vatAmount: 8.33,
            vatRate: 20,
            shippingCost: 0,
            total: 50.00,
            currency: 'EUR',
            paymentMethod: 'stripe',
            paidAt: new Date(),
        },
    })

    // Add order items
    const firstVariant = await prisma.productVariant.findFirst({
        where: { productId: cartesVisite.id },
    })

    if (firstVariant) {
        await prisma.orderItem.create({
            data: {
                orderId: order.id,
                variantId: firstVariant.id,
                productName: 'Cartes de Visite Premium',
                variantDetails: JSON.stringify({
                    format: firstVariant.format,
                    paper: firstVariant.paperWeight,
                    finish: firstVariant.finish,
                }),
                quantity: 500,
                unitPriceHT: 0.0833,
                totalPriceHT: 41.67,
            },
        })
    }

    console.log('✅ Sample order created')

    console.log('🎉 Seeding completed successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
