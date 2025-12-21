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
    companyName: string;
    companyAddress: string;
    companyVat: string;
    companyEmail: string;
    clientName: string;
    clientCompany: string;
    clientAddress: string;
    clientEmail: string;
    clientPhone: string;
    clientVat?: string;
    serviceName: string;
    planName: string;
    planDescription: string;
    lineItems: QuoteLineItem[];
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    vatRate: number;
    vatAmount: number;
    totalTtc: number;
    depositAmount: number;
    showDeposit?: boolean;
    total: number; // This is the HT total
    notes?: string;
    paymentTerms: string;
    signatureImage?: string;
    signedDate?: string;
}

// Compact styles for single-page layout
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 9,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#1A3A5C',
    },
    logo: {
        fontSize: 22,
        fontFamily: 'Helvetica-Bold',
        color: '#1A3A5C',
    },
    logoSubtitle: {
        fontSize: 7,
        color: '#666666',
        letterSpacing: 1.5,
    },
    quoteInfo: {
        textAlign: 'right',
    },
    quoteTitle: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: '#1A1A1A',
        marginBottom: 3,
    },
    quoteNumber: {
        fontSize: 9,
        color: '#666666',
    },
    quoteDate: {
        fontSize: 8,
        color: '#666666',
        marginTop: 1,
    },

    // Parties section - side by side
    partiesSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    partyBox: {
        width: '48%',
        padding: 10,
        backgroundColor: '#F8F9FA',
        borderRadius: 4,
    },
    partyTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#1A3A5C',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    partyName: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#1A1A1A',
        marginBottom: 3,
    },
    partyDetail: {
        fontSize: 8,
        color: '#666666',
        marginBottom: 1,
    },

    // Service banner
    serviceBox: {
        padding: 10,
        backgroundColor: '#1A3A5C',
        borderRadius: 4,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    serviceName: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#FFFFFF',
    },
    serviceDescription: {
        fontSize: 8,
        color: '#FFFFFF',
        opacity: 0.8,
    },

    // Table
    table: {
        marginBottom: 12,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1A1A1A',
        padding: 6,
    },
    tableHeaderText: {
        color: '#FFFFFF',
        fontFamily: 'Helvetica-Bold',
        fontSize: 8,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        padding: 6,
    },
    tableRowAlt: {
        backgroundColor: '#FAFAFA',
    },
    colDescription: { width: '50%' },
    colQty: { width: '12%', textAlign: 'center' },
    colPrice: { width: '19%', textAlign: 'right' },
    colTotal: { width: '19%', textAlign: 'right' },
    cellText: {
        fontSize: 9,
        color: '#333333',
    },

    // Bottom section - totals and terms side by side
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    // Terms on left
    termsSection: {
        width: '55%',
        padding: 10,
        backgroundColor: '#F8F9FA',
        borderRadius: 4,
    },
    termsTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    termsText: {
        fontSize: 7,
        color: '#666666',
        lineHeight: 1.4,
    },

    // Totals on right
    totalsSection: {
        width: '40%',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    totalLabel: {
        fontSize: 9,
        color: '#666666',
    },
    totalValue: {
        fontSize: 9,
        color: '#333333',
        fontFamily: 'Helvetica-Bold',
    },
    discountRow: {
        backgroundColor: '#FFF0F0',
        borderRadius: 2,
    },
    discountText: {
        color: '#E53935',
    },
    grandTotalRow: {
        backgroundColor: '#1A3A5C',
        borderRadius: 4,
        marginTop: 4,
        paddingVertical: 8,
    },
    grandTotalLabel: {
        fontSize: 10,
        color: '#FFFFFF',
        fontFamily: 'Helvetica-Bold',
    },
    grandTotalValue: {
        fontSize: 12,
        color: '#FFFFFF',
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
        color: '#666666',
        marginBottom: 3,
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
        height: 35,
        marginBottom: 3,
    },
    signatureNote: {
        fontSize: 7,
        color: '#999999',
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 30,
        right: 30,
        textAlign: 'center',
        color: '#999999',
        fontSize: 7,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
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
                    <Text style={styles.partyDetail}>{data.clientName}</Text>
                    <Text style={styles.partyDetail}>{data.clientAddress}</Text>
                    <Text style={styles.partyDetail}>{data.clientEmail}</Text>
                </View>
            </View>

            {/* Service Banner */}
            <View style={styles.serviceBox}>
                <View>
                    <Text style={styles.serviceName}>{data.serviceName} - {data.planName}</Text>
                    <Text style={styles.serviceDescription}>{data.planDescription}</Text>
                </View>
            </View>

            {/* Items Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
                    <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
                    <Text style={[styles.tableHeaderText, styles.colPrice]}>Prix unit.</Text>
                    <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
                </View>

                {data.lineItems.map((item, index) => (
                    <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowAlt : {}]}>
                        <Text style={[styles.cellText, styles.colDescription]}>{item.description}</Text>
                        <Text style={[styles.cellText, styles.colQty]}>{item.quantity}</Text>
                        <Text style={[styles.cellText, styles.colPrice]}>{item.unitPrice.toFixed(2)} €</Text>
                        <Text style={[styles.cellText, styles.colTotal]}>{item.total.toFixed(2)} €</Text>
                    </View>
                ))}
            </View>

            {/* Bottom Section: Terms + Totals */}
            <View style={styles.bottomSection}>
                {/* Terms */}
                <View style={styles.termsSection}>
                    <Text style={styles.termsTitle}>Conditions de paiement</Text>
                    <Text style={styles.termsText}>{data.paymentTerms}</Text>
                    {data.notes && (
                        <>
                            <Text style={[styles.termsTitle, { marginTop: 6 }]}>Notes</Text>
                            <Text style={styles.termsText}>{data.notes}</Text>
                        </>
                    )}
                    <Text style={[styles.termsText, { marginTop: 6, fontStyle: 'italic' }]}>
                        {data.vatRate === 0 && data.clientVat ? 'Autoliquidation - Art. 196 de la Directive 2006/112/CE (Reverse Charge)' : 'TVA au taux de ' + data.vatRate + '% comprise.'}
                    </Text>
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Sous-total HT</Text>
                        <Text style={styles.totalValue}>{data.total.toFixed(2)} €</Text>
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TVA ({data.vatRate}%)</Text>
                        <Text style={styles.totalValue}>{data.vatAmount.toFixed(2)} €</Text>
                    </View>

                    <View style={[styles.totalRow, styles.grandTotalRow]}>
                        <Text style={styles.grandTotalLabel}>TOTAL TTC</Text>
                        <Text style={styles.grandTotalValue}>{data.totalTtc.toFixed(2)} €</Text>
                    </View>

                    {data.showDeposit && (
                        <View style={[styles.totalRow, { marginTop: 4, paddingVertical: 4, borderTopWidth: 1, borderTopColor: '#E0E0E0' }]}>
                            <Text style={[styles.totalLabel, { fontFamily: 'Helvetica-Bold' }]}>Acompte 20%</Text>
                            <Text style={[styles.totalValue, { color: '#0D7377' }]}>{data.depositAmount.toFixed(2)} €</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Signature */}
            <View style={styles.signatureSection}>
                <View style={styles.signatureBox}>
                    <Text style={styles.signatureLabel}>Signature client</Text>
                    {data.signatureImage ? (
                        <View style={{ height: 40, marginBottom: 3 }}>
                            <Image src={data.signatureImage} style={{ height: 35, objectFit: 'contain' }} />
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
