'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    Save,
    ArrowLeft,
    Loader2,
    Share2,
    CreditCard
} from 'lucide-react';
import Link from 'next/link';

export default function NewClientPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [referralCode, setReferralCode] = useState('');

    const [startMode, setStartMode] = useState<'full' | 'half'>('full');
    const [services, setServices] = useState([
        { id: 'hosting', type: 'hosting', label: 'Hébergement', amount: '25', selected: true },
        { id: 'maintenance', type: 'maintenance', label: 'Maintenance', amount: '50', selected: false },
        { id: 'ordering', type: 'online_ordering', label: 'Commandes en ligne', amount: '60', selected: false },
    ]);

    const [formData, setFormData] = useState({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'Luxembourg',
        vat_number: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const body = {
                ...formData,
                referral_code: referralCode.trim() || undefined,
                start_mode: startMode,
                initial_services: services.filter(s => s.selected).map(s => ({
                    type: s.type,
                    name: s.label,
                    amount: s.amount,
                    selected: true
                }))
            };

            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create client');
            }

            const data = await response.json();
            // Redirect to the new client's page
            router.push(`/admin/clients/${data.client.id}`);
        } catch (error: any) {
            console.error(error);
            alert(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="bg-white min-h-screen pb-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/admin/clients" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                        <ArrowLeft size={20} />
                        Retour à la liste
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Nouveau Client</h1>
                    <p className="text-gray-500">Ajouter un restaurateur ou commerçant à l'annuaire</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                        <h2 className="font-semibold text-lg flex items-center gap-2">
                            <Building2 size={20} className="text-blue-500" />
                            Informations Société
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la société / Enseigne</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.company_name}
                                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de TVA</label>
                                <input
                                    type="text"
                                    value={formData.vat_number}
                                    onChange={e => setFormData({ ...formData, vat_number: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                        <h2 className="font-semibold text-lg flex items-center gap-2">
                            <User size={20} className="text-blue-500" />
                            Contact Principal
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.contact_name}
                                    onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 rounded-lg border-gray-300 border px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-10 rounded-lg border-gray-300 border px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                        <h2 className="font-semibold text-lg flex items-center gap-2">
                            <MapPin size={20} className="text-blue-500" />
                            Adresse
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rue et numéro</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                                <input
                                    type="text"
                                    value={formData.postal_code}
                                    onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Referral */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm space-y-6">
                        <h2 className="font-semibold text-lg flex items-center gap-2 text-indigo-900">
                            <Share2 size={20} className="text-indigo-600" />
                            Parrainage (Optionnel)
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-indigo-900 mb-1">Code de parrainage</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Ex: REF-12345"
                                    value={referralCode}
                                    onChange={e => setReferralCode(e.target.value.toUpperCase())}
                                    className="w-full rounded-lg border-indigo-200 border px-3 py-2 bg-white focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono"
                                />
                                <p className="text-xs text-indigo-600 mt-2">
                                    Si ce client est parrainé par un client existant, entrez son code ici.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Services & Facturation */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                        <h2 className="font-semibold text-lg flex items-center gap-2">
                            <CreditCard size={20} className="text-blue-500" />
                            Services & Facturation Initiale
                        </h2>

                        {/* Start Mode Toggle */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Période de démarrage (Facturation 1er mois)</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-2/3">
                                <button
                                    type="button"
                                    onClick={() => setStartMode('full')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${startMode === 'full' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Mois complet (100%) - Le 1er
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStartMode('half')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${startMode === 'half' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Mi-mois (50%) - Le 15
                                </button>
                            </div>
                        </div>

                        {/* Services List */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">Services à activer</label>
                            <div className="grid gap-4">
                                {services.map((service, index) => (
                                    <div key={service.id} className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${service.selected ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300'}`}>
                                        <input
                                            type="checkbox"
                                            checked={service.selected}
                                            onChange={(e) => {
                                                const newServices = [...services];
                                                newServices[index].selected = e.target.checked;
                                                setServices(newServices);
                                            }}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <p className={`font-medium ${service.selected ? 'text-blue-900' : 'text-gray-700'}`}>{service.label}</p>
                                        </div>
                                        <div className="w-32">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    disabled={!service.selected}
                                                    value={service.amount}
                                                    onChange={(e) => {
                                                        const newServices = [...services];
                                                        newServices[index].amount = e.target.value;
                                                        setServices(newServices);
                                                    }}
                                                    className="w-full pl-3 pr-8 py-1.5 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            Créer le client
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
