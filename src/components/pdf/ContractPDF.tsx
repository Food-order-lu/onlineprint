'use client';

import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';

export interface ContractData {
    contractNumber: string;
    contractDate: string;
    companyName: string;
    companyAddress: string;
    companyVat: string;
    clientName: string;
    clientCompany: string;
    clientAddress: string;
    clientVat?: string;
    serviceName: string;
    planName: string;
    totalAmountTtc: number;
    monthlyAmount: number;
    durationMonths: number;
    signatureImage?: string;
    signedDate?: string;
}

const styles = StyleSheet.create({
    page: {
        padding: 50,
        fontSize: 10,
        fontFamily: 'Helvetica',
        lineHeight: 1.5,
    },
    header: {
        marginBottom: 30,
        borderBottom: 1,
        borderBottomColor: '#1A3A5C',
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#1A3A5C',
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 8,
        textDecoration: 'underline',
    },
    text: {
        marginBottom: 5,
        textAlign: 'justify',
    },
    parties: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    partyBox: {
        width: '45%',
    },
    bold: {
        fontFamily: 'Helvetica-Bold',
    },
    signatureSection: {
        marginTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '40%',
        borderTop: 1,
        borderTopColor: '#000',
        paddingTop: 10,
        textAlign: 'center',
    },
    signatureImage: {
        height: 50,
        marginBottom: 10,
        objectFit: 'contain',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 50,
        right: 50,
        fontSize: 8,
        textAlign: 'center',
        color: '#666',
    }
});

export const ContractPDF = ({ data }: { data: ContractData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold' }}>RIVEGO T&M Group</Text>
                <Text>Prestations de Services Numériques</Text>
            </View>

            <Text style={styles.title}>CONTRAT DE PRESTATION DE SERVICES</Text>
            <Text style={{ textAlign: 'center', marginBottom: 20 }}>Réf: CON-{data.contractNumber}</Text>

            <View style={styles.parties}>
                <View style={styles.partyBox}>
                    <Text style={styles.bold}>LE PRESTATAIRE :</Text>
                    <Text>{data.companyName}</Text>
                    <Text>{data.companyAddress}</Text>
                    <Text>TVA : {data.companyVat}</Text>
                </View>
                <View style={styles.partyBox}>
                    <Text style={styles.bold}>LE CLIENT :</Text>
                    <Text>{data.clientCompany}</Text>
                    <Text>{data.clientName}</Text>
                    <Text>{data.clientAddress}</Text>
                    {data.clientVat && <Text>TVA : {data.clientVat}</Text>}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Article 1 : Objet du contrat</Text>
                <Text style={styles.text}>
                    Le présent contrat a pour objet la réalisation de la prestation : <Text style={styles.bold}>{data.serviceName} - {data.planName}</Text>.
                    Le Prestataire s&apos;engage à mettre en œuvre son savoir-faire pour la réalisation des services décrits dans le devis accepté.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Article 2 : Durée et Maintenance</Text>
                <Text style={styles.text}>
                    Le présent contrat est conclu pour une durée initiale de <Text style={styles.bold}>{data.durationMonths} mois</Text>.
                    Il inclut la maintenance technique et l&apos;hébergement des services au tarif de <Text style={styles.bold}>{data.monthlyAmount.toFixed(2)} € / mois</Text>.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Article 3 : Conditions Financières</Text>
                <Text style={styles.text}>
                    Le montant total de la prestation initiale est de <Text style={styles.bold}>{data.totalAmountTtc.toFixed(2)} € TTC</Text>.
                    Le règlement s&apos;effectue selon les modalités convenues lors de la signature du devis.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Article 4 : Obligations du Prestataire</Text>
                <Text style={styles.text}>
                    Le Prestataire est tenu à une obligation de moyens. Il s&apos;engage à apporter tout le soin et la diligence nécessaires à la fourniture d&apos;un service de qualité conformément aux usages de la profession.
                </Text>
            </View>

            <View style={styles.signatureSection}>
                <View style={styles.signatureBox}>
                    <Text>Pour RIVEGO</Text>
                    <View style={{ height: 60 }} />
                    <Text style={{ fontSize: 8 }}>(Signature et cachet)</Text>
                </View>
                <View style={styles.signatureBox}>
                    <Text>Le Client</Text>
                    {data.signatureImage ? (
                        <Image src={data.signatureImage} style={styles.signatureImage} />
                    ) : (
                        <View style={{ height: 60 }} />
                    )}
                    <Text style={{ fontSize: 8 }}>{data.signedDate ? `Signé électroniquement le ${data.signedDate}` : '(Signature "Bon pour accord")'}</Text>
                </View>
            </View>

            <Text style={styles.footer}>
                RIVEGO T&M Group - 7, rue Jean-Pierre Sauvage, L-2514 Kirchberg - Luxembourg
            </Text>
        </Page>
    </Document>
);

export const generateContractPDF = async (data: ContractData): Promise<Blob> => {
    const blob = await pdf(<ContractPDF data={data} />).toBlob();
    return blob;
};
