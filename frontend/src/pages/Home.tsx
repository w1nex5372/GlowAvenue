import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, Sparkles, ShieldCheck, Gift } from 'lucide-react';
import { api } from '../lib/api';
import type { Product } from '../lib/types';
import { useSettings } from '../lib/SettingsContext';
import Logo from '../components/Logo';
import ProductCard from '../components/ProductCard';
import SectionHeading from '../components/SectionHeading';
import Loader from '../components/Loader';

const VALUES = [
  { icon: Sparkles, title: '18k Gold Plated', text: 'Premium gold plated stainless steel that keeps its shine.' },
  { icon: ShieldCheck, title: 'Skin Safe', text: 'Tarnish-resistant and gentle on skin, made to last.' },
  { icon: Truck, title: 'UK Delivery', text: 'Shipped from the UK with fast, tracked delivery.' },
  { icon: Gift, title: 'Gift Ready', text: 'Every piece arrives beautifully packaged.' },
];

export default function Home() {
  const settings = useSettings();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [latest, setLatest] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getFeatured(), api.getProducts()])
      .then(([f, all]) => {
        setFeatured(f);
        setLatest(all.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="bg-cream">
        <div className="container-luxe grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="eyebrow">{settings.tagline || 'Timeless Elegance'}</span>
            <h1 className="mt-4 font-serif text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
              {settings.heroTitle}
            </h1>
            <p className="mt-6 max-w-md text-lg text-ink/65">{settings.heroSubtitle}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/collection" className="btn-gold">
                Shop the Collection <ArrowRight size={18} />
              </Link>
              <Link to="/about" className="btn-outline">
                Our Story
              </Link>
            </div>
            <div className="mt-6 flex items-baseline gap-2 sm:hidden">
              <span className="font-serif text-xl text-ink">From £12.99</span>
              <span className="text-xs uppercase tracking-luxe text-ink/50">Everyday luxury</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            {featured[0]?.images?.[0] ? (
              <Link
                to={`/product/${featured[0].slug}`}
                className="block overflow-hidden rounded-3xl border border-gold/30 bg-ink shadow-soft"
              >
                <img
                  src={featured[0].images[0]}
                  alt={featured[0].name}
                  className="aspect-[4/5] w-full object-contain p-4 transition-transform duration-[800ms] ease-out hover:scale-[1.04]"
                />
              </Link>
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center rounded-3xl border border-gold/30 bg-ink text-gold shadow-soft">
                <Logo variant="stacked" tagline />
              </div>
            )}
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl bg-gold px-6 py-4 text-ink shadow-gold sm:block">
              <span className="block font-serif text-2xl">From £12.99</span>
              <span className="text-xs uppercase tracking-luxe">Everyday luxury</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured */}
      {(loading || featured.length > 0) && (
        <section className="bg-white">
          <div className="container-luxe py-16 md:py-24">
            <SectionHeading eyebrow="Curated" title="Featured Pieces" subtitle="A selection of our favourites, loved for their everyday elegance." />
            {loading ? (
              <Loader />
            ) : (
              <div className="mt-12 product-grid">
                {featured.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Why GlamAvenue */}
      <section className="bg-cream">
        <div className="container-luxe py-16 md:py-24">
          <SectionHeading eyebrow="Why GlamAvenue" title="Luxury you can wear every day" />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, text }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="text-center"
              >
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                  <Icon size={24} />
                </span>
                <h3 className="mt-5 font-serif text-lg">{title}</h3>
                <p className="mt-2 text-sm text-ink/60">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {latest.length > 0 && (
        <section className="bg-white">
          <div className="container-luxe py-16 md:py-24">
            <div className="flex items-end justify-between gap-4">
              <SectionHeading align="left" eyebrow="Just In" title="New Arrivals" />
              <Link to="/collection" className="hidden shrink-0 items-center gap-1 text-sm text-gold-dark hover:text-gold sm:inline-flex">
                View all <ArrowRight size={16} />
              </Link>
            </div>
            <div className="mt-12 product-grid">
              {latest.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About preview */}
      <section className="bg-ink text-cream">
        <div className="container-luxe grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="eyebrow">Our Story</span>
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
              Affordable elegance, crafted to last
            </h2>
            <p className="mt-5 text-cream/70">
              {settings.storeName || 'GlamAvenue'} brings you considered, gold plated stainless steel
              jewellery — designed in the spirit of timeless luxury, priced for everyday joy.
            </p>
            <Link to="/about" className="btn-gold mt-8">
              Discover GlamAvenue <ArrowRight size={18} />
            </Link>
          </div>
          <div className="flex justify-center">
            <Logo variant="stacked" tagline className="text-gold" />
          </div>
        </div>
      </section>

      {/* Marketplace CTA */}
      <section className="bg-beige/40">
        <div className="container-luxe py-16 text-center md:py-20">
          <SectionHeading
            eyebrow="Where to buy"
            title="Shop GlamAvenue across your favourite marketplaces"
            subtitle="Each product links straight through to where you can buy it. Browse the collection to find your piece."
          />
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/collection" className="btn-dark">
              Browse the Collection <ArrowRight size={18} />
            </Link>
            {settings.ebayStoreUrl && (
              <a href={settings.ebayStoreUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">
                Visit our eBay Store
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
