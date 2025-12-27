'use client';

import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';

// Types for quote data
export interface QuoteLineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface QuoteData {
    quoteNumber: string;
    quoteDate: string;
    validUntil: string;
    // Company
    companyName: string;
    companyAddress: string;
    companyVat?: string;
    companyEmail: string;
    // Client
    clientName: string;
    clientCompany: string;
    clientAddress: string;
    clientEmail: string;
    clientPhone?: string;
    clientVat?: string;
    // Service
    serviceName: string;
    planName: string;
    planDescription: string;
    // Line Items - separated
    oneTimeItems: QuoteLineItem[];
    monthlyItems: QuoteLineItem[];
    // Totals
    oneTimeTotal: number;
    monthlyTotal: number;
    vatRate: number;
    vatAmount: number;
    totalTtc: number;
    depositPercent: number;
    depositAmount: number;
    // Meta
    notes?: string;
    paymentTerms: string;
    signatureImage?: string;
    signedDate?: string;
}

// Colors matching the image
const COLORS = {
    primary: '#1A3A5C',      // Dark blue (header, tables)
    accent: '#0D7377',       // Teal accent
    text: '#333333',
    textLight: '#666666',
    textMuted: '#999999',
    border: '#E0E0E0',
    bgLight: '#F5F7FA',
    white: '#FFFFFF',
};

// Compact styles for single page
const styles = StyleSheet.create({
    page: {
        padding: 25,
        fontSize: 8,
        fontFamily: 'Helvetica',
        backgroundColor: COLORS.white,
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 8,
    },
    logo: {
        fontSize: 22,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.primary,
    },
    logoSubtitle: {
        fontSize: 7,
        color: COLORS.accent,
        letterSpacing: 1.5,
        marginTop: 1,
    },
    quoteInfo: {
        textAlign: 'right',
    },
    quoteTitle: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.text,
        marginBottom: 2,
    },
    quoteNumber: {
        fontSize: 8,
        color: COLORS.textLight,
    },
    quoteDate: {
        fontSize: 7,
        color: COLORS.textLight,
        marginTop: 1,
    },

    // Parties section - with left border
    partiesSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    partyBox: {
        width: '48%',
        padding: 10,
        paddingLeft: 12,
        backgroundColor: COLORS.bgLight,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    partyTitle: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.accent,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    partyName: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.text,
        marginBottom: 2,
    },
    partyDetail: {
        fontSize: 7,
        color: COLORS.textLight,
        marginBottom: 1,
    },

    // Service banner
    serviceBox: {
        padding: 8,
        backgroundColor: COLORS.primary,
        marginBottom: 10,
    },
    serviceName: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.white,
    },
    serviceDescription: {
        fontSize: 7,
        color: COLORS.white,
        opacity: 0.85,
        marginTop: 1,
    },

    // Section title
    sectionTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.primary,
        marginBottom: 4,
        marginTop: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },

    // Table
    table: {
        marginBottom: 4,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        paddingVertical: 5,
        paddingHorizontal: 8,
    },
    tableHeaderText: {
        color: COLORS.white,
        fontFamily: 'Helvetica-Bold',
        fontSize: 7,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.border,
        paddingVertical: 5,
        paddingHorizontal: 8,
    },
    tableRowAlt: {
        backgroundColor: '#FAFAFA',
    },
    colDescription: { width: '52%' },
    colQty: { width: '12%', textAlign: 'center' },
    colPrice: { width: '18%', textAlign: 'right' },
    colTotal: { width: '18%', textAlign: 'right' },
    cellText: {
        fontSize: 8,
        color: COLORS.text,
    },
    cellTextBold: {
        fontSize: 8,
        color: COLORS.text,
        fontFamily: 'Helvetica-Bold',
    },

    // Table totals row
    tableTotalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    tableTotalLabel: {
        fontSize: 8,
        color: COLORS.textLight,
        marginRight: 15,
    },
    tableTotalValue: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.primary,
    },
    monthlyTotalValue: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.accent,
    },

    // Bottom section
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },

    // Terms on left
    termsSection: {
        width: '46%',
    },
    termsBox: {
        padding: 8,
        backgroundColor: COLORS.bgLight,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    termsTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    termsText: {
        fontSize: 7,
        color: COLORS.textLight,
        lineHeight: 1.4,
    },

    // Totals on right
    totalsSection: {
        width: '48%',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
        paddingHorizontal: 8,
    },
    totalLabel: {
        fontSize: 8,
        color: COLORS.textLight,
    },
    totalValue: {
        fontSize: 8,
        color: COLORS.text,
        fontFamily: 'Helvetica-Bold',
    },
    grandTotalRow: {
        backgroundColor: COLORS.primary,
        marginTop: 3,
        paddingVertical: 6,
    },
    grandTotalLabel: {
        fontSize: 9,
        color: COLORS.white,
        fontFamily: 'Helvetica-Bold',
    },
    grandTotalValue: {
        fontSize: 12,
        color: COLORS.white,
        fontFamily: 'Helvetica-Bold',
    },
    depositRow: {
        backgroundColor: '#E8F4F4',
        marginTop: 3,
    },
    depositLabel: {
        fontSize: 8,
        color: COLORS.accent,
        fontFamily: 'Helvetica-Bold',
    },
    depositValue: {
        fontSize: 9,
        color: COLORS.accent,
        fontFamily: 'Helvetica-Bold',
    },

    // Signature section
    signatureSection: {
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '45%',
    },
    signatureLabel: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.text,
        marginBottom: 3,
    },
    signatureLine: {
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.text,
        height: 30,
        marginBottom: 3,
    },
    signatureNote: {
        fontSize: 6,
        color: COLORS.textMuted,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 15,
        left: 25,
        right: 25,
        textAlign: 'center',
        color: COLORS.textMuted,
        fontSize: 6,
        paddingTop: 6,
        borderTopWidth: 0.5,
        borderTopColor: COLORS.border,
    },
});

// Quote PDF Document Component
export const QuotePDF = ({ data }: { data: QuoteData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.logo}>RIVEGO</Text>
                    <Text style={styles.logoSubtitle}>T&M GROUP</Text>
                </View>
                <View style={styles.quoteInfo}>
                    <Text style={styles.quoteTitle}>DEVIS</Text>
                    <Text style={styles.quoteNumber}>N° {data.quoteNumber}</Text>
                    <Text style={styles.quoteDate}>Date: {data.quoteDate}</Text>
                    <Text style={styles.quoteDate}>Valide jusqu&apos;au: {data.validUntil}</Text>
                </View>
            </View>

            {/* Parties */}
            <View style={styles.partiesSection}>
                <View style={styles.partyBox}>
                    <Text style={styles.partyTitle}>De</Text>
                    <Text style={styles.partyName}>{data.companyName}</Text>
                    <Text style={styles.partyDetail}>{data.companyAddress}</Text>
                    <Text style={styles.partyDetail}>{data.companyEmail}</Text>
                </View>

                <View style={styles.partyBox}>
                    <Text style={styles.partyTitle}>À</Text>
                    <Text style={styles.partyName}>{data.clientCompany}</Text>
                    <Text style={styles.partyDetail}>{data.clientCompany}</Text>
                    <Text style={styles.partyDetail}>{data.clientAddress}</Text>
                    <Text style={styles.partyDetail}>{data.clientEmail}</Text>
                </View>
            </View>

            {/* Service Banner */}
            <View style={styles.serviceBox}>
                <Text style={styles.serviceName}>{data.serviceName} - {data.planName}</Text>
                <Text style={styles.serviceDescription}>{data.planDescription}</Text>
            </View>

            {/* One-Time Items Table */}
            <Text style={styles.sectionTitle}>Frais Uniques (Installation & Setup)</Text>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
                    <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
                    <Text style={[styles.tableHeaderText, styles.colPrice]}>Prix Unit.</Text>
                    <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
                </View>

                {data.oneTimeItems.map((item, index) => (
                    <View key={index} style={[styles.tableRow, index % 2 !== 0 ? styles.tableRowAlt : {}]}>
                        <Text style={[styles.cellText, styles.colDescription]}>{item.description}</Text>
                        <Text style={[styles.cellText, styles.colQty]}>{item.quantity}</Text>
                        <Text style={[styles.cellText, styles.colPrice]}>{item.unitPrice.toFixed(2)} €</Text>
                        <Text style={[styles.cellTextBold, styles.colTotal]}>{item.total.toFixed(2)} €</Text>
                    </View>
                ))}

                <View style={styles.tableTotalRow}>
                    <Text style={styles.tableTotalLabel}>Total Unique HT:</Text>
                    <Text style={styles.tableTotalValue}>{data.oneTimeTotal.toFixed(2)} €</Text>
                </View>
            </View>

            {/* Monthly Items Table */}
            <Text style={styles.sectionTitle}>Frais Mensuels (Récurrents)</Text>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
                    <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
                    <Text style={[styles.tableHeaderText, styles.colPrice]}>Prix Unit.</Text>
                    <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
                </View>

                {data.monthlyItems.map((item, index) => (
                    <View key={index} style={[styles.tableRow, index % 2 !== 0 ? styles.tableRowAlt : {}]}>
                        <Text style={[styles.cellText, styles.colDescription]}>{item.description}</Text>
                        <Text style={[styles.cellText, styles.colQty]}>{item.quantity}</Text>
                        <Text style={[styles.cellText, styles.colPrice]}>{item.unitPrice.toFixed(2)} €</Text>
                        <Text style={[styles.cellTextBold, styles.colTotal]}>{item.total.toFixed(2)} €</Text>
                    </View>
                ))}

                <View style={styles.tableTotalRow}>
                    <Text style={styles.tableTotalLabel}>Total Mensuel:</Text>
                    <Text style={styles.monthlyTotalValue}>{data.monthlyTotal.toFixed(2)} € / mois</Text>
                </View>
            </View>

            {/* Bottom Section: Terms + Totals */}
            <View style={styles.bottomSection}>
                {/* Terms */}
                <View style={styles.termsSection}>
                    <View style={styles.termsBox}>
                        <Text style={styles.termsTitle}>Conditions de paiement</Text>
                        <Text style={styles.termsText}>{data.paymentTerms}</Text>
                        <Text style={[styles.termsText, { marginTop: 4, fontStyle: 'italic' }]}>
                            TVA au taux de {data.vatRate}% comprise.
                        </Text>
                    </View>
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Sous-total Unique HT</Text>
                        <Text style={styles.totalValue}>{data.oneTimeTotal.toFixed(2)} €</Text>
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TVA ({data.vatRate}%)</Text>
                        <Text style={styles.totalValue}>{data.vatAmount.toFixed(2)} €</Text>
                    </View>

                    <View style={[styles.totalRow, styles.grandTotalRow]}>
                        <Text style={styles.grandTotalLabel}>TOTAL UNIQUE TTC</Text>
                        <Text style={styles.grandTotalValue}>{data.totalTtc.toFixed(2)} €</Text>
                    </View>

                    <View style={[styles.totalRow, styles.depositRow]}>
                        <Text style={styles.depositLabel}>Acompte {data.depositPercent}%</Text>
                        <Text style={styles.depositValue}>{data.depositAmount.toFixed(2)} €</Text>
                    </View>
                </View>
            </View>

            {/* Signature */}
            <View style={styles.signatureSection}>
                <View style={styles.signatureBox}>
                    <Text style={styles.signatureLabel}>Signature client</Text>
                    {data.signatureImage ? (
                        <View style={{ height: 30, marginBottom: 3 }}>
                            <Image src={data.signatureImage} style={{ height: 28, objectFit: 'contain' }} />
                        </View>
                    ) : (
                        <View style={styles.signatureLine} />
                    )}
                    {data.signedDate ? (
                        <Text style={styles.signatureNote}>Signé le {data.signedDate}</Text>
                    ) : (
                        <Text style={styles.signatureNote}>Date et signature &quot;Bon pour accord&quot;</Text>
                    )}
                </View>

                <View style={styles.signatureBox}>
                    <Text style={styles.signatureLabel}>Pour RIVEGO T&M Group</Text>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureNote}>Commercial autorisé</Text>
                </View>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
                RIVEGO T&M Group | Luxembourg | formulaire@webvision.lu
            </Text>
        </Page>
    </Document>
);

// Utility to generate PDF blob
export const generateQuotePDF = async (data: QuoteData): Promise<Blob> => {
    const blob = await pdf(<QuotePDF data={data} />).toBlob();
    return blob;
};

export { pdf as PDFRenderer };
