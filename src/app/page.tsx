import Link from 'next/link';
import { ArrowRight, Utensils, Globe, Printer, Car, Sparkles, Users, Zap } from 'lucide-react';

const brands = [
  {
    name: 'FoodOrder.lu',
    description: 'Système de commande en ligne pour restaurants. Intégration sur votre site existant ou création complète.',
    icon: Utensils,
    href: '/services/foodorder',
    color: '#E85D04',
  },
  {
    name: 'WebVision.lu',
    description: 'Création de sites web professionnels. Du site vitrine au e-commerce complet.',
    icon: Globe,
    href: '/services/webvision',
    color: '#0D7377',
  },
  {
    name: 'OnlinePrint.lu',
    description: 'Services d\'impression professionnels. Cartes de visite, flyers, supports marketing.',
    icon: Printer,
    href: '/services/onlineprint',
    color: '#7B2CBF',
  },
  {
    name: 'Extra-Ace.com',
    description: 'Nettoyage et détailing automobile premium. Redonnez vie à votre véhicule.',
    icon: Car,
    href: '/services/extra-ace',
    color: '#0077B6',
  },
];

const values = [
  {
    icon: Sparkles,
    title: 'Excellence',
    description: 'Nous visons l\'excellence dans chaque projet, avec une attention particulière aux détails.',
  },
  {
    icon: Users,
    title: 'Proximité',
    description: 'Un accompagnement personnalisé et une relation de confiance avec chaque client.',
  },
  {
    icon: Zap,
    title: 'Innovation',
    description: 'Des solutions modernes et performantes pour répondre aux défis de demain.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#1A3A5C]/5 to-transparent" />

        <div className="container mx-auto px-6 relative z-10 text-center py-32">
          <div className="animate-slide-up">
            <span className="inline-block px-4 py-2 rounded-full bg-[#1A3A5C]/10 border border-[#1A3A5C]/20 text-sm text-[#1A3A5C] mb-8">
              Votre partenaire digital au Luxembourg
            </span>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-[#1A1A1A]">
              <span className="text-[#1A3A5C]">RIVEGO</span>
              <span className="block text-xl md:text-2xl text-gray-500 mt-4 tracking-widest font-normal">
                T&M GROUP
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Un écosystème de solutions digitales pour propulser votre entreprise.
              Du web au print, de la restauration à l&apos;automobile.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/services" className="btn btn-primary">
                Découvrir nos services
                <ArrowRight size={20} />
              </Link>
              <Link href="/contact" className="btn btn-secondary">
                Nous contacter
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-gray-300 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-gray-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="section section-alt" id="brands">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Nos <span className="text-[#1A3A5C]">Marques</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Un groupe, plusieurs expertises. Découvrez nos différentes entités
              spécialisées pour répondre à tous vos besoins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {brands.map((brand, index) => (
              <Link
                key={brand.name}
                href={brand.href}
                className="card group relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative z-10 flex items-start gap-6">
                  <div
                    className="p-4 rounded-xl shrink-0"
                    style={{ backgroundColor: brand.color }}
                  >
                    <brand.icon size={32} className="text-white" />
                  </div>

                  <div className="flex-1">
                    <h3
                      className="text-2xl font-bold mb-3 transition-colors"
                      style={{ color: brand.color }}
                    >
                      {brand.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {brand.description}
                    </p>
                    <span
                      className="inline-flex items-center gap-2 font-medium"
                      style={{ color: brand.color }}
                    >
                      En savoir plus
                      <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="section relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Notre <span className="text-[#1A3A5C]">Philosophie</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Chez RIVEGO, nous croyons en la puissance du digital pour transformer
              les entreprises. Notre approche repose sur trois piliers fondamentaux.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="card text-center group"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="inline-flex p-4 rounded-full bg-[#1A3A5C]/10 mb-6 group-hover:bg-[#1A3A5C]/20 transition-colors">
                  <value.icon size={32} className="text-[#1A3A5C]" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section section-dark">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Prêt à <span className="text-[#C4A35A]">démarrer</span> ?
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Contactez-nous pour discuter de votre projet. Nous vous accompagnons
            de A à Z pour concrétiser vos ambitions digitales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn bg-[#C4A35A] hover:bg-[#A68B42] text-white">
              Démarrer un projet
              <ArrowRight size={20} />
            </Link>
            <Link href="/admin/login" className="btn bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#1A3A5C]">
              Espace professionnel
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
