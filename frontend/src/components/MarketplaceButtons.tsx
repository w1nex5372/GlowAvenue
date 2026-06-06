import { Facebook, Instagram, Music2, ShoppingBag, type LucideIcon } from 'lucide-react';
import type { Product } from '../lib/types';

interface MarketLink {
  url: string;
  label: string;
  short: string;
  icon: LucideIcon;
  /** Subtle platform accent applied on hover/active (compact icons). */
  accent: string;
}

function getLinks(product: Product): MarketLink[] {
  return [
    {
      url: product.ebayUrl,
      label: 'Buy on eBay',
      short: 'eBay',
      icon: ShoppingBag,
      accent: 'hover:border-gold hover:text-gold active:border-gold active:text-gold',
    },
    {
      url: product.tiktokUrl,
      label: 'Buy on TikTok',
      short: 'TikTok',
      icon: Music2,
      accent: 'hover:border-ink hover:text-ink active:border-ink active:text-ink',
    },
    {
      url: product.facebookUrl,
      label: 'Buy on Facebook',
      short: 'Facebook',
      icon: Facebook,
      accent: 'hover:border-[#1877F2] hover:text-[#1877F2] active:border-[#1877F2] active:text-[#1877F2]',
    },
    {
      url: product.instagramUrl,
      label: 'Message on Instagram',
      short: 'Instagram',
      icon: Instagram,
      accent: 'hover:border-[#E4405F] hover:text-[#E4405F] active:border-[#E4405F] active:text-[#E4405F]',
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

  // Compact: a neat row of subtle circular icon buttons (used on product cards).
  // Returns a fragment so the parent controls the row layout. Empty links → null.
  if (variant === 'compact') {
    if (links.length === 0) return null;
    return (
      <>
        {links.map(({ url, short, icon: Icon, accent }) => (
          <a
            key={short}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={short}
            title={short}
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink/55 transition-colors ${accent}`}
          >
            <Icon size={15} />
          </a>
        ))}
      </>
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
