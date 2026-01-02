// Shared Admin Layout
// Path: /admin/layout.tsx

import Link from 'next/link';
import { LogOut, Home } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white">
            {/* Shared Admin Header */}
            <header className="bg-white border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
                <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">R</div>
                    <span className="font-bold text-xl text-gray-900">Rivego Admin</span>
                </Link>

                <div className="flex items-center gap-6">
                    <Link href="/admin" className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2 text-sm font-medium">
                        <Home size={18} />
                        <span className="hidden sm:inline">Accueil</span>
                    </Link>
                    <Link href="/admin/login" className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 text-sm font-medium">
                        <LogOut size={18} />
                        <span className="hidden sm:inline">Déconnexion</span>
                    </Link>
                </div>
            </header>

            <main>
                {children}
            </main>
        </div>
    );
}
