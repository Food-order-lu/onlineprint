'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, User, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Mot de passe trop court'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Demo credentials
const DEMO_USERS = [
    { email: 'commercial@rivego.lu', password: 'rivego2024', name: 'Commercial RIVEGO' },
    { email: 'admin@rivego.lu', password: 'admin2024', name: 'Admin RIVEGO' },
];

export default function AdminLoginPage() {
    const router = useRouter();
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setError('');
        await new Promise((resolve) => setTimeout(resolve, 500));

        const user = DEMO_USERS.find(
            (u) => u.email === data.email && u.password === data.password
        );

        if (user) {
            localStorage.setItem('rivego_user', JSON.stringify({
                email: user.email,
                name: user.name,
                loggedInAt: new Date().toISOString()
            }));
            router.push('/admin/dashboard');
        } else {
            setError('Email ou mot de passe incorrect');
        }
    };

    return (
        <section className="min-h-screen flex items-center justify-center py-32 bg-gray-50">
            <div className="container mx-auto px-6">
                <div className="max-w-md mx-auto">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <span className="text-4xl font-bold text-[#1A3A5C]">RIVEGO</span>
                        <p className="text-gray-500 mt-2">Espace professionnel</p>
                    </div>

                    {/* Login Card */}
                    <div className="card">
                        <div className="flex items-center justify-center mb-6">
                            <div className="p-4 rounded-full bg-[#1A3A5C]/10">
                                <Lock size={32} className="text-[#1A3A5C]" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Connexion</h1>

                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                                <AlertCircle size={20} className="text-red-500 shrink-0" />
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label className="label">Email</label>
                                <div className="relative">
                                    <input
                                        {...register('email')}
                                        type="email"
                                        className="input pl-12"
                                        placeholder="votre@email.com"
                                    />
                                    <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                </div>
                                {errors.email && (
                                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="label">Mot de passe</label>
                                <div className="relative">
                                    <input
                                        {...register('password')}
                                        type="password"
                                        className="input pl-12"
                                        placeholder="••••••••"
                                    />
                                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn btn-primary w-full"
                            >
                                {isSubmitting ? 'Connexion...' : 'Se connecter'}
                            </button>
                        </form>

                        {/* Demo info */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 text-center mb-2">Identifiants de démonstration :</p>
                            <p className="text-xs text-gray-600 text-center font-mono">
                                commercial@rivego.lu / rivego2024
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
