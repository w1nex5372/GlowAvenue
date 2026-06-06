import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Product } from '../lib/types';
import { formatPrice } from '../lib/format';
import ImagePlaceholder from './ImagePlaceholder';
import MarketplaceButtons, { hasMarketLinks } from './MarketplaceButtons';

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const cover = product.images?.[0];
  const soldOut = product.quantity <= 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3) }}
      className="group flex flex-col"
    >
      <Link to={`/product/${product.slug}`} className="product-media">
        {cover ? (
          <img
            src={cover}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-3 transition-transform duration-[800ms] ease-out group-hover:scale-[1.04] sm:p-4"
          />
        ) : (
          <ImagePlaceholder className="h-full w-full" />
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-[0.6rem] uppercase tracking-luxe text-cream">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-0.5 pt-4">
        <span className="eyebrow">{product.category}</span>
        <Link to={`/product/${product.slug}`}>
          <h3 className="mt-2 font-serif text-base leading-snug transition-colors group-hover:text-gold-dark sm:text-lg">
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/55">
            {product.description}
          </p>
        )}

        <p className="mt-auto pt-4 font-serif text-lg text-ink sm:text-xl">
          {formatPrice(product.price)}
        </p>

        <Link to={`/product/${product.slug}`} className="btn-outline mt-3 w-full">
          View Details
        </Link>

        {hasMarketLinks(product) && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[0.6rem] uppercase tracking-wide2 text-ink/40">Buy at</span>
            <MarketplaceButtons product={product} variant="compact" />
          </div>
        )}
      </div>
    </motion.article>
  );
}
