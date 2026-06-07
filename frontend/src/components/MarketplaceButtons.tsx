import { Facebook, Instagram, Music2, ShoppingBag, type LucideIcon } from 'lucide-react';
import type { Product } from '../lib/types';

interface MarketLink {
  url: string;
  label: string;
  short: string;
  icon: LucideIcon;
  /** Permanent brand color for compact icon buttons. */
  style: string;
}

function getLinks(product: Product): MarketLink[] {
  return [
    {
      url: product.ebayUrl,
      label: 'Buy on eBay',
      short: 'eBay',
      icon: ShoppingBag,
      style: 'border-amber-300/70 bg-amber-50 text-amber-600 hover:bg-amber-100',
    },
    {
      url: product.tiktokUrl,
      label: 'Buy on TikTok',
      short: 'TikTok',
      icon: Music2,
      style: 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100',
    },
    {
      url: product.facebookUrl,
      label: 'Buy on Facebook',
      short: 'FB',
      icon: Facebook,
      style: 'border-blue-200 bg-blue-50 text-[#1877F2] hover:bg-blue-100',
    },
    {
      url: product.instagramUrl,
      label: 'Message on Instagram',
      short: 'IG',
      icon: Instagram,
      style: 'border-pink-200 bg-pink-50 text-[#E4405F] hover:bg-pink-100',
    },
  ].filter((l): l is MarketLink => Boolean(l.url));
}

export function hasMarketLinks(product: Product): boolean {
  return getLinks(product).length > 0;
}

interface Props {
  product: Product;
  variant?: 'full' | 'compact';
}

export default function MarketplaceButtons({ product, variant = 'full' }: Props) {
  const links = getLinks(product);

  if (variant === 'compact') {
    if (links.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[0.65rem] uppercase tracking-wide text-ink/35">Shop on</span>
        {links.map(({ url, short, icon: Icon, style }) => (
          <a
            key={short}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={short}
            title={short}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.65rem] font-medium transition-colors ${style}`}
          >
            <Icon size={11} />
            {short}
          </a>
        ))}
      </div>
    );
  }

  // Full: stacked labelled buttons (used on the product page).
  if (links.length === 0) {
    return (
      <p className="rounded-xl bg-cream px-4 py-3 text-sm text-ink/60">
        This piece will be available to buy shortly. Get in touch to reserve yours.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {links.map(({ url, label, icon: Icon }, index) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={index === 0 ? 'btn-gold w-full' : 'btn-dark w-full'}
        >
          <Icon size={18} />
          {label}
        </a>
      ))}
    </div>
  );
}
