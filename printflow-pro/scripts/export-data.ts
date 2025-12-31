import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Exporting products...');

    const products = await prisma.product.findMany({
        include: {
            variants: {
                include: {
                    pricingTiers: true
                }
            },
            category: true
        }
    });

    const exportPath = path.join(__dirname, '../../printflow-classic/public/data/products.json');

    // Ensure directory exists
    const dir = path.dirname(exportPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(exportPath, JSON.stringify(products, null, 2));
    console.log(`Exported ${products.length} products to ${exportPath}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
