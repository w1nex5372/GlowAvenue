import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Product } from '../lib/types';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

export default function Collection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(searchParams.get('category') || 'All');

  const handleFilter = (cat: string) => {
    setActive(cat);
    if (cat === 'All') {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  };

  useEffect(() => {
    api
      .getProducts()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  const visible = active === 'All' ? products : products.filter((p) => p.category === active);

  return (
    <>
      <section className="bg-ink text-cream">
        <div className="container-luxe py-16 text-center md:py-20">
          <span className="eyebrow">The Collection</span>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Gold Plated Jewellery</h1>
          <p className="mx-auto mt-4 max-w-xl text-cream/70">
            Timeless designs in gold plated stainless steel — bracelets, necklaces, earrings and more.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="container-luxe py-12 md:py-16">
          {loading ? (
            <Loader />
          ) : products.length === 0 ? (
            <p className="py-20 text-center text-ink/50">No products available yet. Please check back soon.</p>
          ) : (
            <>
              {categories.length > 2 && (
                <div className="mb-10 flex flex-wrap justify-center gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleFilter(c)}
                      className={`rounded-full px-5 py-2 text-sm transition ${
                        active === c
                          ? 'bg-ink text-cream'
                          : 'border border-ink/15 text-ink/70 hover:border-gold hover:text-gold'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}

              <div className="product-grid">
                {visible.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
