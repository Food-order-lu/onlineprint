import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';

const brands = [
    { name: 'FoodOrder.lu', href: '/services/foodorder' },
    { name: 'WebVision.lu', href: '/services/webvision' },
    { name: 'OnlinePrint.lu', href: '/services/onlineprint' },
    { name: 'Extra-Ace.com', href: '/services/extra-ace' },
];

const quickLinks = [
    { name: 'Accueil', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'À propos', href: '/about' },
    { name: 'Contact', href: '/contact' },
];

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white">
            <div className="container mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div>
                        <div className="flex flex-col mb-6">
                            <span className="text-3xl font-bold text-white">RIVEGO</span>
                            <span className="text-sm text-gray-400 tracking-widest">T&M GROUP</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Votre partenaire digital au Luxembourg. Solutions web, commande en ligne,
                            impression et services de nettoyage automobile.
                        </p>
                    </div>

                    {/* Nos Marques */}
                    <div>
                        <h4 className="text-lg font-semibold text-white mb-6">Nos Marques</h4>
                        <ul className="space-y-3">
                            {brands.map((brand) => (
                                <li key={brand.href}>
                                    <Link
                                        href={brand.href}
                                        className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
                                    >
                                        {brand.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Liens Rapides */}
                    <div>
                        <h4 className="text-lg font-semibold text-white mb-6">Liens Rapides</h4>
                        <ul className="space-y-3">
                            {quickLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-lg font-semibold text-white mb-6">Contact</h4>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-gray-400 text-sm">
                                <Mail size={18} className="text-blue-400" />
                                <a href="mailto:formulaire@webvision.lu" className="hover:text-white transition-colors">
                                    formulaire@webvision.lu
                                </a>
                            </li>
                            <li className="flex items-center gap-3 text-gray-400 text-sm">
                                <MapPin size={18} className="text-blue-400" />
                                <span>7, rue Jean-Pierre Sauvage<br />L-2514 Kirchberg, Luxembourg</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        © {currentYear} RIVEGO Trade and Marketing Group S.à r.l.-S. Tous droits réservés.
                    </p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="text-gray-500 hover:text-white text-sm transition-colors">
                            Politique de confidentialité
                        </Link>
                        <Link href="/terms" className="text-gray-500 hover:text-white text-sm transition-colors">
                            Conditions générales
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
