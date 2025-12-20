'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Mail, MapPin, CheckCircle } from 'lucide-react';

const contactSchema = z.object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Email invalide'),
    phone: z.string().optional(),
    company: z.string().optional(),
    service: z.string().optional(),
    message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const services = [
    { value: '', label: 'Sélectionner un service' },
    { value: 'webvision', label: 'WebVision - Création web' },
    { value: 'foodorder', label: 'FoodOrder - Commande en ligne' },
    { value: 'onlineprint', label: 'OnlinePrint - Impression' },
    { value: 'extra-ace', label: 'Extra-Ace - Détailing auto' },
    { value: 'other', label: 'Autre' },
];

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
    });

    const onSubmit = async (data: ContactFormData) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log('Form data:', data);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <section className="min-h-screen flex items-center justify-center py-32 bg-gray-50">
                <div className="container mx-auto px-6 text-center">
                    <div className="inline-flex p-6 rounded-full bg-green-100 mb-8">
                        <CheckCircle size={64} className="text-green-600" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4 text-gray-900">Message envoyé !</h1>
                    <p className="text-gray-600 text-lg max-w-md mx-auto">
                        Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <>
            {/* Hero */}
            <section className="relative pt-32 pb-20 bg-gradient-to-br from-white via-gray-50 to-white">
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
                        Nous <span className="text-[#1A3A5C]">Contacter</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Une question, un projet ? N&apos;hésitez pas à nous contacter.
                        Nous vous répondons sous 24h.
                    </p>
                </div>
            </section>

            {/* Contact Form & Info */}
            <section className="section bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Contact Info */}
                        <div className="lg:col-span-1 space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">Informations</h2>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-[#1A3A5C]/10">
                                            <Mail size={24} className="text-[#1A3A5C]" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                                            <a href="mailto:formulaire@webvision.lu" className="text-gray-600 hover:text-[#1A3A5C] transition-colors">
                                                formulaire@webvision.lu
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-[#1A3A5C]/10">
                                            <MapPin size={24} className="text-[#1A3A5C]" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1">Localisation</h3>
                                            <p className="text-gray-600">Luxembourg</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h3 className="font-semibold text-gray-900 mb-4">Nos marques</h3>
                                <ul className="space-y-2 text-gray-600 text-sm">
                                    <li>• FoodOrder.lu - Commande en ligne</li>
                                    <li>• WebVision.lu - Création web</li>
                                    <li>• OnlinePrint.lu - Impression</li>
                                    <li>• Extra-Ace.com - Détailing auto</li>
                                </ul>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="lg:col-span-2">
                            <div className="card">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">Envoyez-nous un message</h2>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="label">Nom complet *</label>
                                            <input {...register('name')} className="input" placeholder="Votre nom" />
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                                        </div>

                                        <div>
                                            <label className="label">Email *</label>
                                            <input {...register('email')} type="email" className="input" placeholder="votre@email.com" />
                                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="label">Téléphone</label>
                                            <input {...register('phone')} type="tel" className="input" placeholder="+352 xxx xxx xxx" />
                                        </div>

                                        <div>
                                            <label className="label">Entreprise</label>
                                            <input {...register('company')} className="input" placeholder="Nom de votre entreprise" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label">Service concerné</label>
                                        <select {...register('service')} className="input">
                                            {services.map((service) => (
                                                <option key={service.value} value={service.value}>{service.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="label">Message *</label>
                                        <textarea
                                            {...register('message')}
                                            className="input min-h-[150px] resize-y"
                                            placeholder="Décrivez votre projet ou posez votre question..."
                                        />
                                        {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
                                    </div>

                                    <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full md:w-auto">
                                        {isSubmitting ? 'Envoi en cours...' : (
                                            <>Envoyer le message <Send size={20} /></>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
