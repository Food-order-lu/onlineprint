'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    ArrowLeft,
    Save,
    Loader2,
    AlertCircle,
    Building2,
    Settings,
    Percent,
    Euro,
    CreditCard
} from 'lucide-react';
import { Client, CommissionConfig } from '@/lib/db/types';

// Schema
const clientSchema = z.object({
    company_name: z.string().min(2, 'Nom requis'),
    contact_name: z.string().min(2, 'Contact requis'),
    email: z.string().email('Email invalide'),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    postal_code: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    country: z.string().default('Luxembourg'),
    vat_number: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),

    // Commission Config
    commission_mode: z.enum(['hybrid', 'legacy_percent', 'legacy_fixed']),
    commission_base_fee: z.number().min(0).optional(),
    commission_percent: z.number().min(0).max(100).optional(),
    commission_threshold: z.number().min(0).optional(),
    commission_fixed_amount: z.number().min(0).optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors }
    } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema) as any,
        defaultValues: {
            commission_mode: 'hybrid',
            commission_base_fee: 60,
            commission_percent: 7,
            commission_threshold: 1000,
            country: 'Luxembourg'
        }
    });

    const commissionMode = watch('commission_mode');

    useEffect(() => {
        async function fetchClient() {
            try {
                const response = await fetch(`/api/clients/${resolvedParams.id}`);
                if (!response.ok) throw new Error('Client not found');
                const data = await response.json();
                const client = data.client as Client;

                // Populate form
                setValue('company_name', client.company_name);
                setValue('contact_name', client.contact_name);
                setValue('email', client.email);
                setValue('phone', client.phone);
                setValue('address', client.address);
                setValue('postal_code', client.postal_code);
                setValue('city', client.city);
                setValue('country', client.country);
                setValue('vat_number', client.vat_number);
                setValue('notes', client.notes);

                // Populate Commission Config
                if (client.commission_config) {
                    setValue('commission_mode', client.commission_config.type);
                    setValue('commission_base_fee', client.commission_config.base_fee);
                    setValue('commission_percent', client.commission_config.percent);
                    setValue('commission_threshold', client.commission_config.threshold);
                    setValue('commission_fixed_amount', client.commission_config.fixed_amount);
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        }
        fetchClient();
    }, [resolvedParams.id, setValue]);

    const onSubmit = async (data: ClientFormData) => {
        setSaving(true);
        try {
            // Construct commission config object
            let commissionConfig: CommissionConfig;

            if (data.commission_mode === 'hybrid') {
                commissionConfig = {
                    type: 'hybrid',
                    base_fee: data.commission_base_fee,
                    percent: data.commission_percent,
                    threshold: data.commission_threshold
                };
            } else if (data.commission_mode === 'legacy_percent') {
                commissionConfig = {
                    type: 'legacy_percent',
                    percent: data.commission_percent
                };
            } else {
                commissionConfig = {
                    type: 'legacy_fixed',
                    fixed_amount: data.commission_fixed_amount
                };
            }

            const payload = {
                company_name: data.company_name,
                contact_name: data.contact_name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                postal_code: data.postal_code,
                city: data.city,
                country: data.country,
                vat_number: data.vat_number,
                notes: data.notes,
                commission_config: commissionConfig
            };

            const response = await fetch(`/api/clients/${resolvedParams.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to update client');

            router.push(`/admin/clients/${resolvedParams.id}`);
            router.refresh();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error updating client');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link
                    href={`/admin/clients/${resolvedParams.id}`}
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Retour au client
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Modifier le client</h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Basic Info */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <Building2 size={20} className="text-gray-400" />
                            Informations Générales
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise *</label>
                                <input {...register('company_name')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact principal *</label>
                                <input {...register('contact_name')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                {errors.contact_name && <p className="text-red-500 text-sm mt-1">{errors.contact_name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input {...register('email')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <input {...register('phone')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                <input {...register('address')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Code Postal</label>
                                <input {...register('postal_code')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                                <input {...register('city')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                                <input {...register('country')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">N° TVA</label>
                                <input {...register('vat_number')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                        </div>
                    </div>

                    {/* Commission Settings - THE MISSING PART */}
                    <div className="bg-white rounded-xl border-2 border-indigo-100 shadow-sm overflow-hidden">
                        <div className="bg-indigo-50/50 px-6 py-4 border-b border-indigo-100">
                            <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
                                <Settings size={20} className="text-indigo-600" />
                                Configuration Commission
                            </h2>
                            <p className="text-sm text-indigo-600/80 mt-1">Définit comment la commission est calculée pour les rapports mensuels.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Modèle de Commission</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <label className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-2 transition-all ${commissionMode === 'hybrid' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" {...register('commission_mode')} value="hybrid" className="sr-only" />
                                        <span className="font-semibold text-gray-900">Hybride (Nouveau)</span>
                                        <span className="text-xs text-center text-gray-500">Fixe si CA faible, sinon %</span>
                                    </label>
                                    <label className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-2 transition-all ${commissionMode === 'legacy_percent' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" {...register('commission_mode')} value="legacy_percent" className="sr-only" />
                                        <span className="font-semibold text-gray-900">Pourcentage (Ancien)</span>
                                        <span className="text-xs text-center text-gray-500">Toujours un % du CA</span>
                                    </label>
                                    <label className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-2 transition-all ${commissionMode === 'legacy_fixed' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" {...register('commission_mode')} value="legacy_fixed" className="sr-only" />
                                        <span className="font-semibold text-gray-900">Fixe (Legacy)</span>
                                        <span className="text-xs text-center text-gray-500">Montant fixe mensuel</span>
                                    </label>
                                </div>
                            </div>

                            {/* Conditional Fields */}
                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                                {commissionMode === 'hybrid' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Seuil CA (€)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    {...register('commission_threshold', { valueAsNumber: true })}
                                                    className="w-full pl-3 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <Euro size={16} className="absolute right-3 top-2.5 text-gray-400" />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">En dessous, le forfait minimum s'applique.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Forfait Minimum (€)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    {...register('commission_base_fee', { valueAsNumber: true })}
                                                    className="w-full pl-3 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <Euro size={16} className="absolute right-3 top-2.5 text-gray-400" />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Montant à payer si CA &lt; Seuil.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Pourcentage (%)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    {...register('commission_percent', { valueAsNumber: true })}
                                                    className="w-full pl-3 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <Percent size={16} className="absolute right-3 top-2.5 text-gray-400" />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Appliqué sur le CA total.</p>
                                        </div>
                                        <div className="md:col-span-3 bg-blue-50 text-blue-800 text-sm p-3 rounded-lg flex items-start gap-2">
                                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                            <p>
                                                <strong>Résumé:</strong> Si le CA est inférieur à {watch('commission_threshold')}€, le client paie {watch('commission_base_fee')}€. Sinon, il paie {watch('commission_percent')}% du CA.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {commissionMode === 'legacy_percent' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pourcentage de Commission (%)</label>
                                        <div className="relative max-w-xs">
                                            <input
                                                type="number"
                                                step="0.1"
                                                {...register('commission_percent', { valueAsNumber: true })}
                                                className="w-full pl-3 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <Percent size={16} className="absolute right-3 top-2.5 text-gray-400" />
                                        </div>
                                    </div>
                                )}

                                {commissionMode === 'legacy_fixed' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Montant Fixe Mensuel (€)</label>
                                        <div className="relative max-w-xs">
                                            <input
                                                type="number"
                                                step="0.01"
                                                {...register('commission_fixed_amount', { valueAsNumber: true })}
                                                className="w-full pl-3 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <Euro size={16} className="absolute right-3 top-2.5 text-gray-400" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            Enregistrer les modifications
                        </button>
                        <Link
                            href={`/admin/clients/${resolvedParams.id}`}
                            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
