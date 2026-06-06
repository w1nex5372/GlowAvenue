import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Check, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Product, RiskLevel } from '../lib/types';
import { formatPrice } from '../lib/format';
import Loader from '../components/Loader';

const RISK_STYLES: Record<RiskLevel, string> = {
  safe: 'bg-green-100 text-green-700',
  risky: 'bg-red-100 text-red-700',
  bundle: 'bg-amber-100 text-amber-700',
};

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .adminGetProducts()
      .then(setProducts)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) navigate('/admin/login');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [products, query]);

  const remove = async (p: Product) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setDeleting(p.id);
    try {
      await api.adminDeleteProduct(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Products</h1>
          <p className="mt-1 text-sm text-ink/55">{products.length} total</p>
        </div>
        <Link to="/admin/products/new" className="btn-gold">
          <Plus size={18} /> Add product
        </Link>
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        <input
          className="input pl-9"
          placeholder="Search name, SKU or category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="card-surface mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/45">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Visible</th>
                <th className="px-4 py-3 font-medium">Featured</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-cream/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cream">
                        {p.images?.[0] && (
                          <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                        )}
                      </span>
                      <span className="font-medium text-ink">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{p.sku}</td>
                  <td className="px-4 py-3 text-ink/60">{p.category}</td>
                  <td className="px-4 py-3">{formatPrice(p.price)}</td>
                  <td className={`px-4 py-3 ${p.quantity <= 3 ? 'font-semibold text-amber-600' : ''}`}>
                    {p.quantity}
                  </td>
                  <td className="px-4 py-3">
                    {p.visible ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <X size={16} className="text-ink/30" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.featured ? (
                      <Check size={16} className="text-gold-dark" />
                    ) : (
                      <X size={16} className="text-ink/30" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        RISK_STYLES[p.riskLevel ?? 'safe']
                      }`}
                    >
                      {p.riskLevel ?? 'safe'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/admin/products/${p.id}/edit`}
                        className="rounded-lg p-2 text-ink/60 transition hover:bg-gold/15 hover:text-gold-dark"
                        aria-label="Edit"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(p)}
                        disabled={deleting === p.id}
                        className="rounded-lg p-2 text-ink/60 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-ink/50">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
