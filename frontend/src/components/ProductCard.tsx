import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Product } from '../lib/types';
import { formatPrice } from '../lib/format';
import ImagePlaceholder from './ImagePlaceholder';
import MarketplaceButtons from './MarketplaceButtons';

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const cover = product.images?.[0];
  const soldOut = product.quantity <= 0;
  const merchandisingBadge = product.bestSeller
    ? 'Best Seller'
    : product.newArrival
      ? 'New Arrival'
      : product.trending
        ? 'Trending'
        : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3) }}
      className="group relative flex flex-col rounded-2xl bg-white transition-[transform,box-shadow] duration-500 hover:-translate-y-1.5 hover:shadow-card"
    >
      <Link to={`/product/${product.slug}`} className="product-media transition-[box-shadow,border-color] duration-500 group-hover:border-gold/35 group-hover:shadow-soft">
        {cover ? (
          <img
            src={cover}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-3 transition-transform duration-[900ms] ease-out group-hover:scale-[1.07] sm:p-4"
          />
        ) : (
          <ImagePlaceholder className="h-full w-full" />
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-[0.6rem] uppercase tracking-luxe text-cream">
            Sold out
          </span>
        )}
        {!soldOut && merchandisingBadge && (
          <span className="absolute left-3 top-3 rounded-full border border-gold/30 bg-white/90 px-3 py-1 text-[0.58rem] font-medium uppercase tracking-wide2 text-gold-dark shadow-sm backdrop-blur-sm">
            {merchandisingBadge}
          </span>
        )}
        <span className="absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
      </Link>

      <div className="flex flex-1 flex-col px-1 pt-5">
        <span className="eyebrow">{product.category}</span>
        <Link to={`/product/${product.slug}`}>
          <h3 className="mt-2 font-serif text-base leading-snug transition-colors duration-300 group-hover:text-gold-dark sm:text-lg">
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/55">
            {product.description}
          </p>
        )}

        {/* Bottom-anchored block keeps price, CTA and icons aligned across cards. */}
        <div className="mt-auto pt-4">
          <p className="font-serif text-lg text-ink sm:text-xl">{formatPrice(product.price)}</p>

          <Link to={`/product/${product.slug}`} className="btn-outline mt-4 w-full group-hover:border-gold/70">
            View Piece
          </Link>

          {/* Reserved single-row slot: present even with no links, so all cards
              line up; icons only render when links exist. */}
          <div className="mt-3 min-h-[1.75rem]">
            <MarketplaceButtons product={product} variant="compact" />
          </div>
        </div>
      </div>
    </motion.article>
  );
}
