'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    ArrowLeft,
    Search,
    FileText,
    Send,
    Save,
    CheckCircle,
    Percent,
    Globe,
    Download,
    Eye,
    QrCode,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

// Schema for quote form
const quoteSchema = z.object({
    vatNumber: z.string().optional(),
    clientName: z.string().min(2, 'Nom requis'),
    clientEmail: z.string().email('Email invalide'),
    clientPhone: z.string().min(8, 'Téléphone requis'),
    clientCompany: z.string().min(2, 'Entreprise requise'),
    clientAddress: z.string().min(5, 'Adresse requise'),
    plan: z.string(),
    monthly: z.array(z.object({
        name: z.string(),
        price: z.number(),
        unit: z.string().optional(),
        selected: z.boolean(),
        note: z.string().optional(),
    })),
    extras: z.array(z.object({
        name: z.string(),
        price: z.number(),
        selected: z.boolean(),
    })),
    discountPercent: z.number().min(0).max(100).optional(),
    discountEuros: z.number().min(0).optional(),
    paymentTerms: z.enum(['acompte20', 'custom']),
    customPaymentTerms: z.string().optional(),
    notes: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

// WebVision plans
const webvisionPlans = [
    {
        id: 'supplements',
        name: 'Suppléments uniquement',
        basePrice: 0,
        description: 'Pas de site web - Services mensuels uniquement',
        features: ['Choisissez vos services mensuels ci-dessous']
    },
    {
        id: 'essentiel',
        name: 'Essentiel',
        basePrice: 399,
        description: 'Site vitrine professionnel',
        features: ['Design moderne', 'Responsive mobile', 'Formulaire contact', 'SEO de base']
    },
    {
        id: 'business',
        name: 'Business',
        basePrice: 599,
        description: 'Site complet avec fonctionnalités avancées',
        features: ['Tout de Essentiel', 'Menu digital', 'Galerie photos', 'Google Maps']
    },
    {
        id: 'premium',
        name: 'Premium',
        basePrice: 799,
        description: 'Solution complète sur mesure',
        features: ['Tout de Business', 'Réservation en ligne', 'Multi-langues', 'Support prioritaire']
    },
];

// Abonnements mensuels (hosting/services)
const monthlyServices = [
    { name: 'Hébergement & Maintenance', price: 25, unit: '/mois', required: false, defaultSelected: true },
    { name: 'Système commande en ligne', price: 60, unit: '/mois', required: false, note: 'Min 60€/mois, taux variable selon contrat' },
    { name: 'Retouche photos qualité studio (IA)', price: 60, unit: '/mois', required: false, note: 'Retouche illimitée des photos du restaurant' },
    { name: 'Réservation de table', price: 10, unit: '/mois', required: false, note: 'Système de réservation en ligne' },
    { name: 'Chatbot site web', price: 25, unit: '/mois', required: false, note: 'Assistant IA disponible 24/7' },
    { name: 'Traduction avis & affichage', price: 9, unit: '/mois', required: false, note: 'Avis traduits et affichés sur le site' },
];

// Options ponctuelles (one-time)
const oneTimeExtras = [
    { name: 'Photos en présentiel', price: 60 },
    { name: 'Menu digital sur le site', price: 40 },
    { name: 'Site multi-langues', price: 30 },
    { name: 'Imprimante (reconditionné)', price: 150, note: 'Installation incluse' },
    { name: 'Router pour imprimante', price: 40, note: 'Installation incluse' },
];

// Generate quote number
const generateQuoteNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DEV-${year}${month}-${random}`;
};

// Format date
const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

// PDF Download Component (client-side only)
function PDFDownloadButton({ quoteData, quoteNumber }: { quoteData: any; quoteNumber: string }) {
    const [isClient, setIsClient] = useState(false);
    const [PDFDownloadLink, setPDFDownloadLink] = useState<any>(null);
    const [QuotePDF, setQuotePDF] = useState<any>(null);

    useEffect(() => {
        setIsClient(true);
        // Dynamically import PDF components only on client
        Promise.all([
            import('@react-pdf/renderer'),
            import('@/components/pdf/QuotePDF'),
        ]).then(([reactPdf, quotePdf]) => {
            setPDFDownloadLink(() => reactPdf.PDFDownloadLink);
            setQuotePDF(() => quotePdf.QuotePDF);
        });
    }, []);

    if (!isClient || !PDFDownloadLink || !QuotePDF) {
        return (
            <button className="btn btn-primary" disabled>
                <Download size={20} />
                Préparation PDF...
            </button>
        );
    }

    return (
        <PDFDownloadLink
            document={<QuotePDF data={quoteData} />}
            fileName={`devis-${quoteNumber}.pdf`}
            className="btn btn-primary inline-flex items-center gap-2"
        >
            {({ loading }: { loading: boolean }) =>
                loading ? 'Génération...' : (
                    <>
                        <Download size={20} />
                        Télécharger PDF
                    </>
                )
            }
        </PDFDownloadLink>
    );
}

export default function QuoteBuilderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [vatLookupLoading, setVatLookupLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [quoteData, setQuoteData] = useState<any>(null);
    const [quoteNumber, setQuoteNumber] = useState('');
    const [showQRModal, setShowQRModal] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<QuoteFormData>({
        resolver: zodResolver(quoteSchema),
        defaultValues: {
            plan: 'essentiel',
            monthly: monthlyServices.map(s => ({ ...s, selected: s.defaultSelected || false })),
            extras: oneTimeExtras.map(e => ({ ...e, selected: false })),
            discountPercent: 0,
            discountEuros: 0,
            paymentTerms: 'acompte20',
            customPaymentTerms: '',
        },
    });

    const selectedPlan = watch('plan');
    const monthly = watch('monthly');
    const extras = watch('extras');
    const discountPercent = watch('discountPercent') || 0;
    const discountEuros = watch('discountEuros') || 0;
    const paymentTerms = watch('paymentTerms');

    useEffect(() => {
        const user = localStorage.getItem('rivego_user');
        if (!user) {
            router.push('/admin/login');
        }
        setLoading(false);
    }, [router]);

    const calculateTotal = () => {
        const plan = webvisionPlans.find(p => p.id === selectedPlan);
        const basePrice = plan?.basePrice || 0;
        const monthlyTotal = monthly.filter(s => s.selected).reduce((sum, s) => sum + s.price, 0);
        const extrasTotal = extras.filter(e => e.selected).reduce((sum, e) => sum + e.price, 0);

        // HT Calculations
        const subtotal = basePrice + extrasTotal;
        const discountFromPercent = subtotal * (discountPercent / 100);
        const discount = discountFromPercent + discountEuros;
        const totalHt = Math.max(0, subtotal - discount);

        // VAT logic
        const vatNumber = watch('vatNumber');
        const isInternational = vatNumber && !vatNumber.toUpperCase().startsWith('LU');
        const vatRate = isInternational ? 0 : 17;

        const vatAmount = totalHt * (vatRate / 100);
        const totalTtc = totalHt + vatAmount;
        const depositAmount = totalTtc * 0.20;

        return {
            basePrice,
            monthlyTotal,
            extrasTotal,
            subtotal,
            discount,
            totalHt,
            vatRate,
            vatAmount,
            totalTtc,
            depositAmount,
            plan
        };
    };

    const totals = calculateTotal();

    const handleVatLookup = async () => {
        const vatNumber = watch('vatNumber');
        if (!vatNumber || vatNumber.length < 4) return;

        setVatLookupLoading(true);

        try {
            const response = await fetch('/api/vies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vatNumber }),
            });

            const data = await response.json();

            if (data.valid && data.companyName) {
                setValue('clientCompany', data.companyName);
                if (data.address) {
                    setValue('clientAddress', data.address);
                }
                alert(`✅ TVA valide: ${data.companyName}`);
            } else if (data.error) {
                alert(`❌ ${data.error}`);
            } else {
                alert('❌ Numéro de TVA non trouvé');
            }
        } catch (error) {
            alert('Erreur de connexion au service VIES');
        }

        setVatLookupLoading(false);
    };

    const onSubmit = async (data: QuoteFormData) => {
        const newQuoteNumber = generateQuoteNumber();
        setQuoteNumber(newQuoteNumber);

        const today = new Date();
        const validUntil = new Date(today);
        validUntil.setDate(validUntil.getDate() + 30);

        const lineItems = [];
        const plan = webvisionPlans.find(p => p.id === data.plan);
        if (plan) {
            lineItems.push({
                description: `Site ${plan.name}`,
                quantity: 1,
                unitPrice: plan.basePrice,
                total: plan.basePrice,
            });
        }
        // Add one-time extras
        data.extras.filter(e => e.selected).forEach(extra => {
            lineItems.push({
                description: extra.name,
                quantity: 1,
                unitPrice: extra.price,
                total: extra.price,
            });
        });
        // Add monthly services (shown as monthly cost)
        data.monthly.filter(s => s.selected).forEach(service => {
            lineItems.push({
                description: `${service.name} (mensuel)`,
                quantity: 1,
                unitPrice: service.price,
                total: service.price,
            });
        });

        const pdfData = {
            quoteNumber: newQuoteNumber,
            quoteDate: formatDate(today),
            validUntil: formatDate(validUntil),
            companyName: 'RIVEGO Trade and Marketing Group S.à r.l.-S',
            companyAddress: '7, rue Jean-Pierre Sauvage, L-2514 Kirchberg',
            companyVat: 'LU35916651',
            companyEmail: 'formulaire@webvision.lu',
            clientName: data.clientName,
            clientCompany: data.clientCompany,
            clientAddress: data.clientAddress,
            clientEmail: data.clientEmail,
            clientPhone: data.clientPhone,
            clientVat: data.vatNumber,
            serviceName: 'WebVision',
            planName: plan?.name || '',
            planDescription: plan?.description || '',
            lineItems,
            subtotal: totals.subtotal,
            discountPercent: data.discountPercent || 0,
            discountAmount: totals.discount,
            total: totals.totalHt,
            vatRate: totals.vatRate,
            vatAmount: totals.vatAmount,
            totalTtc: totals.totalTtc,
            depositAmount: totals.depositAmount,
            showDeposit: data.paymentTerms === 'acompte20',
            notes: data.notes,
            paymentTerms: data.paymentTerms === 'acompte20'
                ? `Acompte de 20% (${totals.depositAmount.toFixed(2)}€) à la signature. Solde à la livraison.`
                : data.customPaymentTerms || 'Conditions à définir.',
        };

        setQuoteData(pdfData);
        setShowSuccess(true);
    };

    const toggleExtra = (index: number) => {
        const currentExtras = [...extras];
        currentExtras[index].selected = !currentExtras[index].selected;
        setValue('extras', currentExtras);
    };

    const toggleMonthly = (index: number) => {
        const currentMonthly = [...monthly];
        // Don't allow deselecting required services
        if (monthlyServices[index]?.required && currentMonthly[index].selected) return;
        currentMonthly[index].selected = !currentMonthly[index].selected;
        setValue('monthly', currentMonthly);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-gray-500">Chargement...</div>
            </div>
        );
    }

    if (showSuccess && quoteData) {
        return (
            <section className="min-h-screen flex items-center justify-center py-32 bg-gray-50">
                <div className="container mx-auto px-6 text-center max-w-2xl">
                    <div className="inline-flex p-6 rounded-full bg-green-100 mb-8">
                        <CheckCircle size={64} className="text-green-600" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4 text-gray-900">Devis créé !</h1>
                    <p className="text-gray-600 text-lg mb-4">
                        Devis N° <strong>{quoteNumber}</strong> pour <strong>{quoteData.clientCompany}</strong>
                    </p>
                    <p className="text-3xl font-bold text-[#0D7377] mb-8">{quoteData.totalTtc.toFixed(2)} € (TTC)</p>

                    <div className="flex gap-4 justify-center flex-wrap mb-8">
                        <PDFDownloadButton quoteData={quoteData} quoteNumber={quoteNumber} />

                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowQRModal(true)}
                        >
                            <QrCode size={20} />
                            QR Signature mobile
                        </button>

                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                const signUrl = `/quote/${quoteNumber}/sign`;
                                window.open(signUrl, '_blank');
                            }}
                        >
                            <Eye size={20} />
                            Voir page signature
                        </button>

                        <button className="btn bg-[#0D7377] text-white hover:bg-[#0A5A5C]">
                            <Send size={20} />
                            Envoyer par email
                        </button>
                    </div>

                    <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                        ← Retour au dashboard
                    </Link>

                    {/* QR Code Modal */}
                    {showQRModal && (
                        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center relative">
                                <button
                                    onClick={() => setShowQRModal(false)}
                                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={24} />
                                </button>

                                <h3 className="text-xl font-bold text-gray-900 mb-2">Signature mobile</h3>
                                <p className="text-gray-500 text-sm mb-6">
                                    Le client scanne ce QR code pour signer sur son téléphone
                                </p>

                                <div className="bg-white p-4 rounded-xl inline-block border-2 border-gray-100 mb-4">
                                    <QRCodeSVG
                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/quote/${quoteNumber}/sign`}
                                        size={200}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>

                                <p className="text-xs text-gray-400">
                                    Devis N° {quoteNumber}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen pt-24 pb-12 bg-gray-50">
            <div className="container mx-auto px-6">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin/dashboard" className="p-2 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#0D7377]">
                                <Globe size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Devis <span className="text-[#0D7377]">WebVision</span>
                                </h1>
                                <p className="text-gray-500">Création de site web professionnel</p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="card">
                                <h2 className="text-xl font-semibold mb-6 text-gray-900">Informations client</h2>

                                <div className="mb-6">
                                    <label className="label">N° TVA (optionnel)</label>
                                    <div className="flex gap-2">
                                        <input {...register('vatNumber')} className="input flex-1" placeholder="LU12345678" />
                                        <button type="button" onClick={handleVatLookup} disabled={vatLookupLoading} className="btn btn-secondary py-0 px-4">
                                            {vatLookupLoading ? <span className="animate-pulse">...</span> : <Search size={20} />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Entrez un n° TVA UE pour remplir automatiquement</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="label">Nom complet *</label>
                                        <input {...register('clientName')} className="input" placeholder="Jean Dupont" />
                                        {errors.clientName && <p className="text-red-500 text-sm mt-1">{errors.clientName.message}</p>}
                                    </div>
                                    <div>
                                        <label className="label">Email *</label>
                                        <input {...register('clientEmail')} type="email" className="input" placeholder="client@email.com" />
                                        {errors.clientEmail && <p className="text-red-500 text-sm mt-1">{errors.clientEmail.message}</p>}
                                    </div>
                                    <div>
                                        <label className="label">Téléphone *</label>
                                        <input {...register('clientPhone')} type="tel" className="input" placeholder="+352 xxx xxx xxx" />
                                        {errors.clientPhone && <p className="text-red-500 text-sm mt-1">{errors.clientPhone.message}</p>}
                                    </div>
                                    <div>
                                        <label className="label">Restaurant / Entreprise *</label>
                                        <input {...register('clientCompany')} className="input" placeholder="Nom du restaurant" />
                                        {errors.clientCompany && <p className="text-red-500 text-sm mt-1">{errors.clientCompany.message}</p>}
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <label className="label">Adresse *</label>
                                    <textarea {...register('clientAddress')} className="input min-h-[80px]" placeholder="Adresse complète" />
                                    {errors.clientAddress && <p className="text-red-500 text-sm mt-1">{errors.clientAddress.message}</p>}
                                </div>
                            </div>

                            <div className="card">
                                <h2 className="text-xl font-semibold mb-6 text-gray-900">Formule WebVision</h2>
                                <div className="grid grid-cols-1 gap-4">
                                    {webvisionPlans.map((plan) => (
                                        <label key={plan.id} className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${selectedPlan === plan.id ? 'border-[#0D7377] bg-[#0D7377]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <input type="radio" {...register('plan')} value={plan.id} className="sr-only" />
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="font-semibold text-lg text-gray-900">{plan.name}</div>
                                                    <div className="text-gray-500 text-sm mb-3">{plan.description}</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {plan.features.map((feature) => (
                                                            <span key={feature} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">{feature}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-2xl font-bold text-[#0D7377]">{plan.basePrice} €</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Monthly Services */}
                            <div className="card">
                                <h2 className="text-xl font-semibold mb-2 text-gray-900">Services mensuels</h2>
                                <p className="text-sm text-gray-500 mb-6">Abonnements récurrents</p>
                                <div className="space-y-4">
                                    {monthly.map((service, index) => (
                                        <label
                                            key={service.name}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start justify-between gap-4 ${service.selected ? 'border-[#0D7377] bg-[#0D7377]/5' : 'border-gray-200 hover:border-gray-300'} ${monthlyServices[index]?.required ? 'opacity-100' : ''}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={service.selected}
                                                    onChange={() => toggleMonthly(index)}
                                                    disabled={monthlyServices[index]?.required}
                                                    className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#0D7377] focus:ring-[#0D7377] disabled:opacity-50"
                                                />
                                                <div>
                                                    <span className="text-gray-900 font-medium">{service.name}</span>
                                                    {monthlyServices[index]?.required && (
                                                        <span className="ml-2 text-xs bg-[#0D7377] text-white px-2 py-0.5 rounded">Inclus</span>
                                                    )}
                                                    {monthlyServices[index]?.note && (
                                                        <p className="text-xs text-gray-500 mt-1">{monthlyServices[index].note}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-[#0D7377] font-bold whitespace-nowrap">{service.price} €/mois</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* One-time Extras */}
                            <div className="card">
                                <h2 className="text-xl font-semibold mb-2 text-gray-900">Options ponctuelles</h2>
                                <p className="text-sm text-gray-500 mb-6">Frais uniques</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {extras.map((extra, index) => (
                                        <label key={extra.name} className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${extra.selected ? 'border-[#0D7377] bg-[#0D7377]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" checked={extra.selected} onChange={() => toggleExtra(index)} className="w-5 h-5 rounded border-gray-300 text-[#0D7377] focus:ring-[#0D7377]" />
                                                <span className="text-gray-700">{extra.name}</span>
                                            </div>
                                            <span className="text-[#0D7377] font-medium">+{extra.price} €</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="card">
                                <h2 className="text-xl font-semibold mb-6 text-gray-900">Conditions de paiement</h2>
                                <div className="space-y-4">
                                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${watch('paymentTerms') === 'acompte20' ? 'border-[#0D7377] bg-[#0D7377]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" {...register('paymentTerms')} value="acompte20" className="w-5 h-5 text-[#0D7377] focus:ring-[#0D7377]" />
                                        <div>
                                            <span className="font-medium text-gray-900">Acompte 20%</span>
                                            <p className="text-sm text-gray-500">20% à la signature, solde à la livraison</p>
                                        </div>
                                    </label>

                                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${watch('paymentTerms') === 'custom' ? 'border-[#0D7377] bg-[#0D7377]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" {...register('paymentTerms')} value="custom" className="w-5 h-5 mt-1 text-[#0D7377] focus:ring-[#0D7377]" />
                                        <div className="flex-1">
                                            <span className="font-medium text-gray-900">Personnalisé</span>
                                            {watch('paymentTerms') === 'custom' && (
                                                <textarea
                                                    {...register('customPaymentTerms')}
                                                    className="input mt-2 min-h-[60px]"
                                                    placeholder="Ex: Paiement en 3 fois sans frais..."
                                                />
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="card">
                                <h2 className="text-xl font-semibold mb-6 text-gray-900">Notes</h2>
                                <textarea {...register('notes')} className="input min-h-[100px]" placeholder="Notes internes ou spécifications particulières..." />
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="card sticky top-24">
                                <h2 className="text-xl font-semibold mb-6 text-gray-900">Récapitulatif</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Formule de base</span>
                                        <span>{totals.basePrice} €</span>
                                    </div>
                                    {totals.extrasTotal > 0 && (
                                        <div className="flex justify-between text-gray-600">
                                            <span>Options ponctuelles</span>
                                            <span>+{totals.extrasTotal} €</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-medium text-gray-900 pt-2 border-t border-gray-100">
                                        <span>Sous-total unique</span>
                                        <span>{totals.subtotal} €</span>
                                    </div>

                                    {totals.monthlyTotal > 0 && (
                                        <div className="flex justify-between text-[#0D7377] bg-[#0D7377]/5 p-3 rounded-lg -mx-2">
                                            <span className="font-medium">Mensuel</span>
                                            <span className="font-bold">{totals.monthlyTotal} €/mois</span>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-gray-200">
                                        <label className="label flex items-center gap-2">
                                            <Percent size={16} />
                                            Remise commerciale
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <input type="number" {...register('discountPercent', { valueAsNumber: true })} min="0" max="100" className="input w-20 text-center" />
                                                <span className="text-gray-500">%</span>
                                            </div>
                                            <span className="text-gray-400">ou</span>
                                            <div className="flex items-center gap-2">
                                                <input type="number" {...register('discountEuros', { valueAsNumber: true })} min="0" className="input w-24 text-center" />
                                                <span className="text-gray-500">€</span>
                                            </div>
                                        </div>
                                    </div>

                                    {(discountPercent > 0 || discountEuros > 0) && (
                                        <div className="flex justify-between text-red-500">
                                            <span>Remise totale</span>
                                            <span>-{totals.discount.toFixed(2)} €</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-200 mb-8 space-y-2">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Total HT</span>
                                        <span>{totals.totalHt.toFixed(2)} €</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>TVA ({totals.vatRate}%)</span>
                                        <span>{totals.vatAmount.toFixed(2)} €</span>
                                    </div>
                                    <div className="flex justify-between text-2xl font-bold pt-2 border-t border-gray-100">
                                        <span className="text-gray-900">Total TTC</span>
                                        <span className="text-[#0D7377]">{totals.totalTtc.toFixed(2)} €</span>
                                    </div>
                                    {paymentTerms === 'acompte20' && (
                                        <div className="flex justify-between text-sm font-medium text-[#0D7377] bg-[#0D7377]/5 p-2 rounded-lg">
                                            <span>Acompte 20%</span>
                                            <span>{totals.depositAmount.toFixed(2)} €</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <button type="submit" className="btn btn-primary w-full">
                                        <FileText size={20} />
                                        Générer le devis
                                    </button>
                                    <button type="button" className="btn w-full bg-gray-100 hover:bg-gray-200 text-gray-700">
                                        <Save size={20} />
                                        Sauvegarder brouillon
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </section>
    );
}
