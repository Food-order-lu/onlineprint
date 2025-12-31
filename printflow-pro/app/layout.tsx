import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'PrintFlow Pro - Impression professionnelle à prix revendeur',
    description: 'Plateforme d\'impression print-on-demand : cartes de visite, flyers, affiches, dépliants. Qualité professionnelle, prix compétitifs.',
    keywords: 'impression, print-on-demand, cartes de visite, flyers, affiches, dépliants',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="fr">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className={inter.className}>{children}</body>
        </html>
    )
}
