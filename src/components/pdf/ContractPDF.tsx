'use client';

import { Document, Page, Text, View, StyleSheet, pdf, Image, Font } from '@react-pdf/renderer';

// Register a standard font if needed, but Helvetica is default and safe.

export interface ContractData {
    // Prestataire
    companyName: string;
    companyAddress: string;
    companyRcs: string;
    companyVat: string;
    companyEmail: string;
    companyPhone: string;

    // Client
    clientType: string;
    clientCompany?: string;
    clientName: string;
    clientAddress: string;
    clientEmail: string;
    clientPhone: string;
    clientVat?: string;

    // Service & Plan
    serviceName: string;
    planName: string;
    planDescription: string;

    // Conditions Financières
    oneTimeTotal: string; // Formatted price (e.g. "599.00")
    oneTimeAmountTtc: string;
    monthlyAmount: string;
    monthlyAmountTtc: string;

    // Remises
    discountPercent: number;
    discountEuros: number;
    discountAmount: string;

    // Modalités
    paymentTerms: string;
    depositPercentage: number;
    depositAmount: string;
    customPaymentTerms?: string;

    // Meta
    contractNumber: string;
    notes?: string;
    signedDate: string;
    signatureImage?: string;
}

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        lineHeight: 1.4,
        color: '#222',
    },
    header: {
        marginBottom: 20,
        textAlign: 'center',
    },
    title: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 4,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 12,
        fontFamily: 'Helvetica',
        marginBottom: 20,
        textAlign: 'center',
        color: '#444',
    },
    section: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 4,
        marginTop: 6,
        textDecoration: 'underline',
    },
    text: {
        marginBottom: 4,
        textAlign: 'justify',
    },
    bold: {
        fontFamily: 'Helvetica-Bold',
    },
    partiesContainer: {
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        backgroundColor: '#f9f9f9',
    },
    list: {
        marginLeft: 15,
    },
    listItem: {
        marginBottom: 2,
    },
    signatureSection: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        breakInside: 'avoid',
    },
    signatureBox: {
        width: '45%',
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 8,
    },
    signatureImage: {
        height: 40,
        marginTop: 5,
        objectFit: 'contain',
        alignSelf: 'flex-start'
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 40,
        right: 40,
        fontSize: 8,
        textAlign: 'center',
        color: '#888',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
    }
});

export const ContractPDF = ({ data }: { data: ContractData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>CONTRAT DE PRESTATION DE SERVICES</Text>
                <Text style={styles.subtitle}>{data.serviceName} – Création de site web & système de commande en ligne</Text>
            </View>

            {/* 1. Parties */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. Parties au contrat</Text>

                <View style={styles.partiesContainer}>
                    <Text style={[styles.text, styles.bold, { marginBottom: 2 }]}>Prestataire</Text>
                    <Text style={styles.text}>La société {data.companyName},</Text>
                    <Text style={styles.text}>ayant son siège social au {data.companyAddress},</Text>
                    <Text style={styles.text}>immatriculée au Registre de Commerce et des Sociétés de Luxembourg sous le numéro {data.companyRcs},</Text>
                    <Text style={styles.text}>numéro de TVA {data.companyVat},</Text>
                    <Text style={styles.text}>email {data.companyEmail}, téléphone {data.companyPhone},</Text>
                    <Text style={[styles.text, { marginTop: 4, fontStyle: 'italic' }]}>ci-après dénommée « le Prestataire ».</Text>
                </View>

                <View style={styles.partiesContainer}>
                    <Text style={[styles.text, styles.bold, { marginBottom: 2 }]}>Client</Text>
                    <Text style={styles.text}>Le présent contrat est conclu exclusivement entre professionnels, agissant dans le cadre de leur activité commerciale ou professionnelle.</Text>
                    <Text style={styles.text}>Type de client : {data.clientType}</Text>
                    {data.clientCompany && <Text style={styles.text}>La société {data.clientCompany},</Text>}
                    <Text style={styles.text}>représentée par {data.clientName},</Text>
                    <Text style={styles.text}>ayant son adresse au {data.clientAddress},</Text>
                    <Text style={styles.text}>email {data.clientEmail}, téléphone {data.clientPhone},</Text>
                    {data.clientVat && <Text style={styles.text}>numéro de TVA {data.clientVat},</Text>}
                    <Text style={[styles.text, { marginTop: 4, fontStyle: 'italic' }]}>ci-après dénommée « le Client ».</Text>
                </View>
                <Text style={[styles.text, { textAlign: 'center', marginTop: 5 }]}>Le Prestataire et le Client sont désignés ensemble les « Parties ».</Text>
            </View>

            {/* 2. Objet */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Objet du contrat</Text>
                <Text style={styles.text}>
                    Le présent contrat a pour objet la fourniture par le Prestataire de services de conception, développement, mise en ligne, hébergement, maintenance et exploitation d’un site web ainsi que d’un système de commande en ligne, commercialisés sous l’appellation {data.serviceName}.
                </Text>
                <Text style={styles.text}>Le Client souscrit au plan suivant : <Text style={styles.bold}>{data.planName}</Text></Text>
                <Text style={styles.text}>Description : {data.planDescription}</Text>
                <Text style={styles.text}>Les fonctionnalités, options et services sélectionnés font partie intégrante du présent contrat.</Text>
            </View>

            {/* 3. Obligations Prestataire */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. Obligations du Prestataire</Text>
                <Text style={styles.text}>Le Prestataire s’engage à exécuter les services de manière professionnelle, conforme aux règles de l’art et aux usages du secteur.</Text>
                <Text style={styles.text}>Il s’engage notamment à :</Text>
                <View style={styles.list}>
                    <Text style={styles.listItem}>• Réaliser et livrer le site web et le système de commande en ligne conformément au plan souscrit.</Text>
                    <Text style={styles.listItem}>• Mobiliser les moyens techniques et humains nécessaires à la bonne exécution des prestations.</Text>
                    <Text style={styles.listItem}>• Garantir que les livrables fournis ne portent pas atteinte aux droits de propriété intellectuelle de tiers.</Text>
                </View>
                <Text style={styles.text}>Le Prestataire est tenu à une obligation de moyens et conserve une totale indépendance dans l’exécution des services.</Text>
            </View>

            {/* 4. Obligations Client */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>4. Obligations du Client</Text>
                <Text style={styles.text}>Le Client s’engage à :</Text>
                <View style={styles.list}>
                    <Text style={styles.listItem}>• Fournir l’ensemble des contenus, informations et validations nécessaires.</Text>
                    <Text style={styles.listItem}>• Garantir qu’il détient tous les droits sur les éléments transmis.</Text>
                    <Text style={styles.listItem}>• Régler les sommes dues dans les délais contractuels.</Text>
                </View>
                <Text style={styles.text}>Tout retard ou défaut de collaboration du Client suspend les délais sans engager la responsabilité du Prestataire.</Text>
            </View>

            {/* 5. Durée */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>5. Durée et renouvellement</Text>
                <Text style={styles.text}>Le présent contrat entre en vigueur à la date de sa signature par les deux Parties (ou à la date de début des Services stipulée au contrat) et est conclu pour une durée initiale d’un (1) mois.</Text>
                <Text style={styles.text}>Il sera ensuite renouvelé automatiquement par tacite reconduction, pour des périodes successives d’une durée d’un (1) mois, sauf dénonciation par l’une des Parties dans les conditions prévues à l’Article 13.</Text>
                <Text style={styles.text}>Chaque période renouvelée est soumise aux mêmes conditions contractuelles.</Text>
                <Text style={styles.text}>Il n’existe aucune limite au nombre de reconductions tacites, sauf accord écrit contraire.</Text>
            </View>

            {/* 6. Conditions financières */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>6. Conditions financières</Text>

                <View style={{ marginBottom: 10 }}>
                    <Text style={[styles.text, styles.bold, { borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2 }]}>
                        6.1 Services Ponctuels (One-Off)
                    </Text>
                    <Text style={styles.text}>Ces frais couvrent la conception, création, et mise en place initiale.</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={styles.text}>Total HT :</Text>
                        <Text style={styles.bold}>{data.oneTimeTotal} €</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.text}>TVA (17%) :</Text>
                        <Text style={styles.text}>{(parseFloat(data.oneTimeAmountTtc) - parseFloat(data.oneTimeTotal)).toFixed(2)} €</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 2 }}>
                        <Text style={styles.bold}>Total TTC :</Text>
                        <Text style={styles.bold}>{data.oneTimeAmountTtc} €</Text>
                    </View>
                </View>

                <View>
                    <Text style={[styles.text, styles.bold, { borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2 }]}>
                        6.2 Services Mensuels (Récurrents)
                    </Text>
                    <Text style={styles.text}>Ces frais couvrent l'hébergement, la maintenance, les licences logicielles et le support.</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={styles.text}>Mensualité HT :</Text>
                        <Text style={styles.bold}>{data.monthlyAmount} € / mois</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.text}>TVA (17%) :</Text>
                        <Text style={styles.text}>{(parseFloat(data.monthlyAmountTtc) - parseFloat(data.monthlyAmount)).toFixed(2)} €</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 2 }}>
                        <Text style={styles.bold}>Mensualité TTC :</Text>
                        <Text style={styles.bold}>{data.monthlyAmountTtc} € / mois</Text>
                    </View>
                </View>

                <Text style={[styles.text, { marginTop: 8, fontSize: 9, color: '#666' }]}>
                    Les factures récurrentes sont émises mensuellement. Le paiement s'effectue par prélèvement automatique SEPA.
                </Text>
            </View>

            {/* 7. Remises */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>7. Remises</Text>
                <View style={styles.list}>
                    <Text style={styles.listItem}>• Remise % : {data.discountPercent} %</Text>
                    <Text style={styles.listItem}>• Remise fixe : {data.discountEuros} €</Text>
                    <Text style={styles.listItem}>• Total remise : {data.discountAmount} €</Text>
                </View>
            </View>

            {/* 8. Paiement */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>8. Modalités de paiement</Text>
                <Text style={styles.text}>Type de paiement : {data.paymentTerms}</Text>
                <Text style={styles.text}>Acompte : {data.depositPercentage} %, soit {data.depositAmount} € TTC</Text>
                {data.customPaymentTerms && <Text style={styles.text}>Modalités spécifiques : {data.customPaymentTerms}</Text>}
                <Text style={[styles.text, { marginTop: 4 }]}>Tout retard de paiement entraîne :</Text>
                <View style={styles.list}>
                    <Text style={styles.listItem}>• intérêts de retard légaux (directive UE / droit luxembourgeois),</Text>
                    <Text style={styles.listItem}>• indemnité forfaitaire de recouvrement,</Text>
                    <Text style={styles.listItem}>• droit de suspension des services.</Text>
                </View>
            </View>

            {/* 9. IP */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>9. Propriété intellectuelle</Text>
                <Text style={styles.text}>Après paiement intégral :</Text>
                <View style={styles.list}>
                    <Text style={styles.listItem}>• le Client dispose d’un droit d’utilisation du site et du système,</Text>
                    <Text style={styles.listItem}>• sans transfert de propriété du code source, sauf accord écrit contraire.</Text>
                </View>
                <Text style={styles.text}>Les outils, frameworks, composants, méthodes et savoir-faire préexistants restent la propriété exclusive du Prestataire.</Text>
                <Text style={styles.text}>Le Prestataire peut citer le Client comme référence commerciale, sauf opposition écrite.</Text>
            </View>

            {/* 10. RGPD */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>10. Protection des données personnelles (RGPD)</Text>
                <Text style={styles.text}>Le Client agit en qualité de Responsable du traitement.</Text>
                <Text style={styles.text}>Le Prestataire agit en qualité de Sous-traitant.</Text>
                <Text style={styles.text}>Le Prestataire :</Text>
                <View style={styles.list}>
                    <Text style={styles.listItem}>• traite les données uniquement sur instruction du Client,</Text>
                    <Text style={styles.listItem}>• garantit confidentialité et sécurité,</Text>
                    <Text style={styles.listItem}>• notifie toute violation de données,</Text>
                    <Text style={styles.listItem}>• supprime ou restitue les données à la fin du contrat.</Text>
                </View>
                <Text style={styles.text}>Un Accord de Sous-traitance des Données (DPA) pourra être annexé au présent contrat conformément à l’article 28 du RGPD.</Text>
            </View>

            {/* 11. SLA */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>11. Niveau de service (SLA)</Text>
                <Text style={styles.text}>Le Prestataire s’engage à fournir un service conforme aux standards du marché, sans garantie de disponibilité continue.</Text>
                <Text style={styles.text}>Les interruptions dues à la maintenance, à des tiers ou à des cas de force majeure ne sauraient engager la responsabilité du Prestataire.</Text>
            </View>

            {/* 12. Responsabilité */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>12. Responsabilité</Text>
                <Text style={styles.text}>La responsabilité du Prestataire est limitée aux dommages directs et plafonnée au montant total payé par le Client au cours des douze (12) derniers mois.</Text>
                <Text style={styles.text}>Sont exclus :</Text>
                <View style={styles.list}>
                    <Text style={styles.listItem}>• pertes indirectes,</Text>
                    <Text style={styles.listItem}>• pertes de chiffre d’affaires,</Text>
                    <Text style={styles.listItem}>• pertes de données,</Text>
                    <Text style={styles.listItem}>• préjudices commerciaux ou d’image.</Text>
                </View>
            </View>
        </Page>

        <Page size="A4" style={styles.page}>
            {/* 13. Résiliation */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>13. Résiliation</Text>
                <Text style={styles.text}>
                    Le présent contrat peut être résilié par l'une ou l'autre des Parties moyennant un <Text style={styles.bold}>préavis écrit de deux (2) mois</Text> avant la fin de la période contractuelle en cours.
                </Text>
                <Text style={styles.text}>La résiliation doit être notifiée par lettre recommandée avec accusé de réception ou par email avec confirmation de lecture.</Text>
                <Text style={styles.text}>En cas de manquement grave non corrigé sous 30 jours après mise en demeure, la résiliation pourra être immédiate.</Text>
            </View>

            {/* 14. Non-sollicitation */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>14. Non-sollicitation</Text>
                <Text style={styles.text}>Pendant la durée du contrat et pendant 12 mois après sa cessation, le Client s’interdit de solliciter ou d’employer tout collaborateur ou prestataire du Prestataire sans accord écrit préalable.</Text>
            </View>

            {/* 15. Force majeure */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>15. Force majeure</Text>
                <Text style={styles.text}>Aucune Partie ne pourra être tenue responsable en cas de force majeure au sens du droit luxembourgeois.</Text>
            </View>

            {/* 16. Droit applicable */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>16. Droit applicable – Juridiction</Text>
                <Text style={styles.text}>Le présent contrat est régi par le droit luxembourgeois.</Text>
                <Text style={styles.text}>Tout litige relève de la compétence exclusive des tribunaux du Grand-Duché de Luxembourg.</Text>
            </View>

            {/* 17. Dispositions finales */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>17. Dispositions finales</Text>
                {data.notes && <Text style={styles.text}>Notes complémentaires : {data.notes}</Text>}
                <Text style={styles.text}>Le présent contrat constitue l’intégralité de l’accord entre les Parties.</Text>
            </View>

            {/* Signatures */}
            <View style={[styles.section, { borderTopWidth: 2, borderTopColor: '#000', paddingTop: 20, marginTop: 40 }]}>
                <Text style={styles.bold}>Contrat n° {data.contractNumber}</Text>
                <Text style={styles.text}>Date de signature : {data.signedDate}</Text>

                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.bold}>Pour le Prestataire</Text>
                        <Text>{data.companyName}</Text>
                        <Text style={{ fontSize: 9, color: '#666', marginTop: 30 }}>(Signature)</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.bold}>Pour le Client</Text>
                        <Text>{data.clientName}</Text>
                        {data.signatureImage ? (
                            <Image src={data.signatureImage} style={styles.signatureImage} />
                        ) : (
                            <Text style={{ fontSize: 9, color: '#666', marginTop: 30 }}>(Signature)</Text>
                        )}
                    </View>
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
