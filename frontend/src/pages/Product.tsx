import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Check, Truck } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Product } from '../lib/types';
import { formatPrice } from '../lib/format';
import { useSettings } from '../lib/SettingsContext';
import ProductGallery from '../components/ProductGallery';
import MarketplaceButtons from '../components/MarketplaceButtons';
import Loader from '../components/Loader';

// Brand quality promises shown on every product (presentation, not per-item data).
const FEATURES = ['Tarnish Resistant', 'Waterproof', 'Hypoallergenic', 'UK Delivery'];

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const settings = useSettings();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    api
      .getProduct(slug)
      .then(setProduct)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Loader label="Loading product…" />;

  if (notFound || !product) {
    return (
      <div className="container-luxe py-28 text-center">
        <h1 className="font-serif text-3xl">Product not found</h1>
        <p className="mt-3 text-ink/60">This piece may no longer be available.</p>
        <Link to="/collection" className="btn-gold mt-8">
          Back to the Collection
        </Link>
      </div>
    );
  }

  const inStock = product.quantity > 0;

  return (
    <section className="bg-white">
      <div className="container-luxe py-10 md:py-16">
        <nav className="mb-8 flex flex-wrap items-center gap-1 text-xs text-ink/45">
          <Link to="/" className="hover:text-gold">Home</Link>
          <ChevronRight size={14} className="shrink-0" />
          <Link to="/collection" className="hover:text-gold">Collection</Link>
          <ChevronRight size={14} className="shrink-0" />
          <span className="text-ink/70">{product.name}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
          <div className="md:sticky md:top-28 md:self-start">
            <ProductGallery images={product.images} alt={product.name} />
          </div>

          <div className="flex flex-col">
            <span className="eyebrow">{product.category}</span>
            <h1 className="mt-3 font-serif text-3xl leading-[1.15] sm:text-4xl">{product.name}</h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="font-serif text-2xl text-ink">{formatPrice(product.price)}</p>
              {inStock ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                  <Check size={15} /> In stock
                </span>
              ) : (
                <span className="text-sm text-ink/50">Currently sold out</span>
              )}
            </div>

            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-ink/60 sm:flex sm:flex-wrap">
              {FEATURES.map((f) => (
                <li key={f} className="inline-flex items-center gap-2">
                  <Check size={15} className="shrink-0 text-gold-dark" /> {f}
                </li>
              ))}
            </ul>

            {product.description && (
              <p className="mt-7 leading-relaxed text-ink/70">{product.description}</p>
            )}

            <dl className="mt-7 space-y-2.5 border-y border-ink/10 py-5 text-sm">
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 text-ink/45">Material</dt>
                <dd className="text-ink/80">{product.material}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 text-ink/45">Category</dt>
                <dd className="text-ink/80">{product.category}</dd>
              </div>
            </dl>

            <div className="mt-7">
              <h2 className="mb-3 text-xs uppercase tracking-luxe text-ink/45">Where to buy</h2>
              <MarketplaceButtons product={product} variant="full" />
            </div>

            {settings.shippingText && (
              <p className="mt-6 inline-flex items-center gap-2 text-sm text-ink/55">
                <Truck size={16} className="text-gold-dark" /> {settings.shippingText}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
