'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const navLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/services', label: 'Services' },
    { href: '/services/foodorder', label: 'FoodOrder' },
    { href: '/services/webvision', label: 'WebVision' },
    { href: '/services/onlineprint', label: 'OnlinePrint' },
    { href: '/services/extra-ace', label: 'Extra-Ace' },
    { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass py-3 shadow-md' : 'bg-white/80 backdrop-blur-sm py-5'
                }`}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex flex-col items-start">
                    <span className="text-2xl font-bold logo-text">RIVEGO</span>
                    <span className="text-xs logo-subtitle tracking-widest">T&M GROUP</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-gray-600 hover:text-primary transition-colors relative group"
                        >
                            {link.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                        </Link>
                    ))}
                    <Link href="/admin/login" className="btn btn-primary text-sm py-2 px-4">
                        Espace Pro
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="lg:hidden text-gray-800 p-2"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Navigation */}
            <div
                className={`lg:hidden bg-white border-t border-gray-100 absolute top-full left-0 right-0 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-screen py-4 shadow-lg' : 'max-h-0'
                    }`}
            >
                <div className="container mx-auto px-6 flex flex-col gap-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-gray-600 hover:text-primary py-2 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link
                        href="/admin/login"
                        className="btn btn-primary text-center mt-2"
                        onClick={() => setIsOpen(false)}
                    >
                        Espace Pro
                    </Link>
                </div>
            </div>
        </nav>
    );
}
