import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Check, Gem, Globe2, PackageCheck, Share2, Sparkles } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Product } from '../lib/types';
import { formatPrice } from '../lib/format';
import ProductGallery from '../components/ProductGallery';
import MarketplaceButtons from '../components/MarketplaceButtons';
import Loader from '../components/Loader';

const BRAND_PROMISES = [
  { label: 'Carefully packaged', icon: PackageCheck },
  { label: 'Worldwide shipping available', icon: Globe2 },
  { label: 'Gold plated stainless steel', icon: Gem },
];

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product?.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* dismissed */ }
  };

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
  const fullDescription = product.fullDescription || product.description;
  const features = (product.features ?? []).filter((feature) => feature.trim());

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
            <div className="flex items-start justify-between gap-4">
              <span className="eyebrow">{product.category}</span>
              <button
                type="button"
                onClick={handleShare}
                title="Share this product"
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink/50 transition hover:border-gold hover:text-gold-dark"
              >
                {copied ? <Check size={13} /> : <Share2 size={13} />}
                {copied ? 'Copied!' : 'Share'}
              </button>
            </div>
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

            {product.shortDescription && (
              <p className="mt-5 text-base leading-relaxed text-ink/65 sm:text-lg">
                {product.shortDescription}
              </p>
            )}

            {features.length > 0 ? (
              <div className="mt-7 rounded-2xl border border-gold/20 bg-cream/70 p-5">
                <h2 className="flex items-center gap-2 text-xs uppercase tracking-luxe text-gold-dark">
                  <Sparkles size={15} /> Highlights
                </h2>
                <ul className="mt-4 grid gap-3 text-sm text-ink/70 sm:grid-cols-2">
                  {features.map((feature, index) => (
                    <li key={`${feature}-${index}`} className="flex items-start gap-2.5">
                      <Check size={15} className="mt-0.5 shrink-0 text-gold-dark" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="mt-7 grid gap-3 text-sm text-ink/60 sm:grid-cols-3">
                {BRAND_PROMISES.map(({ label, icon: Icon }) => (
                  <li key={label} className="flex items-center gap-2 rounded-xl bg-cream px-3 py-3">
                    <Icon size={16} className="shrink-0 text-gold-dark" /> {label}
                  </li>
                ))}
              </ul>
            )}

            {fullDescription && (
              <div className="mt-8">
                <h2 className="text-xs uppercase tracking-luxe text-ink/45">Description</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-ink/70">{fullDescription}</p>
              </div>
            )}

            <div className="mt-8 border-y border-ink/10 py-6">
              <h2 className="text-xs uppercase tracking-luxe text-ink/45">Product details</h2>
              <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                <Detail label="Material" value={product.material} />
                <Detail label="Category" value={product.category} />
                <Detail label="Dimensions" value={product.dimensions} />
                <Detail label="Weight" value={product.weight} />
              </dl>
            </div>

            {(product.careGuide || product.shippingInfo) && (
              <div className="divide-y divide-ink/10 border-b border-ink/10">
                {product.careGuide && <Accordion title="Care guide" content={product.careGuide} />}
                {product.shippingInfo && <Accordion title="Shipping information" content={product.shippingInfo} />}
              </div>
            )}

            <div className="mt-8">
              <h2 className="mb-3 text-xs uppercase tracking-luxe text-ink/45">Where to buy</h2>
              <MarketplaceButtons product={product} variant="full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-ink/45">{label}</dt>
      <dd className="text-ink/80">{value}</dd>
    </div>
  );
}

function Accordion({ title, content }: { title: string; content: string }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm font-medium text-ink marker:hidden">
        {title}
        <ChevronDown size={17} className="shrink-0 text-gold-dark transition-transform group-open:rotate-180" />
      </summary>
      <p className="whitespace-pre-line pb-5 text-sm leading-relaxed text-ink/65">{content}</p>
    </details>
  );
}
