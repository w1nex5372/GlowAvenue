import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Product } from '../lib/types';
import { formatPrice } from '../lib/format';
import ImagePlaceholder from './ImagePlaceholder';
import MarketplaceButtons from './MarketplaceButtons';

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const cover = product.images?.[0];

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3) }}
      className="group flex flex-col"
    >
      <Link
        to={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-2xl bg-cream"
      >
        {cover ? (
          <img
            src={cover}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholder className="h-full w-full" />
        )}
        {product.quantity <= 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-[0.65rem] uppercase tracking-luxe text-cream">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-1 pt-4">
        <span className="eyebrow">{product.category}</span>
        <Link to={`/product/${product.slug}`}>
          <h3 className="mt-1.5 font-serif text-lg leading-snug transition-colors group-hover:text-gold-dark">
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm text-ink/60">{product.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="font-serif text-lg text-ink">{formatPrice(product.price)}</span>
          <MarketplaceButtons product={product} variant="compact" />
        </div>

        <Link
          to={`/product/${product.slug}`}
          className="btn-outline mt-4 w-full"
        >
          View Details
        </Link>
      </div>
    </motion.article>
  );
}
