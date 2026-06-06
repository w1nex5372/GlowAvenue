import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { ProductFormValues, RiskLevel } from '../lib/types';
import ImageUploader from './ImageUploader';
import Loader from '../components/Loader';

const COMMON_CATEGORIES = ['Bracelets', 'Necklaces', 'Earrings', 'Rings', 'Anklets', 'Sets', 'Bundles'];

const EMPTY: ProductFormValues = {
  name: '',
  sku: '',
  category: '',
  price: '',
  quantity: '0',
  material: '18k Gold Plated Stainless Steel',
  description: '',
  images: [],
  ebayUrl: '',
  tiktokUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  riskLevel: 'safe',
  visible: true,
  featured: false,
};

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-ink/80">{label}</span>
        {hint && <span className="block text-xs text-ink/45">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-gold' : 'bg-ink/20'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  );
}

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<ProductFormValues>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api
      .adminGetProduct(id)
      .then((p) =>
        setForm({
          name: p.name,
          sku: p.sku,
          category: p.category,
          price: String(p.price),
          quantity: String(p.quantity),
          material: p.material,
          description: p.description,
          images: p.images ?? [],
          ebayUrl: p.ebayUrl ?? '',
          tiktokUrl: p.tiktokUrl ?? '',
          facebookUrl: p.facebookUrl ?? '',
          instagramUrl: p.instagramUrl ?? '',
          riskLevel: p.riskLevel ?? 'safe',
          visible: p.visible ?? true,
          featured: p.featured,
        }),
      )
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) navigate('/admin/login');
        else setError('Could not load this product.');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      ...form,
      price: Number(form.price),
      quantity: parseInt(form.quantity, 10) || 0,
    };

    try {
      if (isEdit && id) {
        await api.adminUpdateProduct(id, payload);
      } else {
        await api.adminCreateProduct(payload);
      }
      navigate('/admin/products');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/admin/login');
      else setError(err instanceof ApiError ? err.message : 'Failed to save product');
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id || !window.confirm(`Delete "${form.name}"? This cannot be undone.`)) return;
    try {
      await api.adminDeleteProduct(id);
      navigate('/admin/products');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete product');
    }
  };

  if (loading) return <Loader label="Loading product…" />;

  return (
    <form onSubmit={submit}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/admin/products" className="inline-flex items-center gap-1 text-sm text-ink/50 hover:text-gold">
            <ArrowLeft size={15} /> Back to products
          </Link>
          <h1 className="mt-2 font-serif text-3xl">{isEdit ? 'Edit product' : 'New product'}</h1>
        </div>
        <button type="submit" className="btn-gold" disabled={saving}>
          <Save size={18} /> {saving ? 'Saving…' : 'Save product'}
        </button>
      </div>

      {error && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <section className="card-surface p-6">
            <h2 className="font-serif text-lg">Product details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="name">Name</label>
                <input
                  id="name"
                  className="input"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="GlamAvenue Celeste Gold Bracelet"
                  required
                />
                <p className="mt-1 text-xs text-ink/40">A URL slug is generated automatically from the name.</p>
              </div>
              <div>
                <label className="field-label" htmlFor="sku">SKU</label>
                <input
                  id="sku"
                  className="input"
                  value={form.sku}
                  onChange={(e) => set('sku', e.target.value)}
                  placeholder="GA-CELESTE-BR"
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="category">Category</label>
                <input
                  id="category"
                  className="input"
                  list="category-options"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder="Bracelets"
                  required
                />
                <datalist id="category-options">
                  {COMMON_CATEGORIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="field-label" htmlFor="price">Price (£)</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  placeholder="12.99"
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  min="0"
                  className="input"
                  value={form.quantity}
                  onChange={(e) => set('quantity', e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="material">Material</label>
                <input
                  id="material"
                  className="input"
                  value={form.material}
                  onChange={(e) => set('material', e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="input min-h-[120px] resize-y"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="A delicate everyday bracelet with a timeless gold finish…"
                />
              </div>
            </div>
          </section>

          <section className="card-surface p-6">
            <h2 className="font-serif text-lg">Images</h2>
            <div className="mt-4">
              <ImageUploader value={form.images} onChange={(urls) => set('images', urls)} />
            </div>
          </section>

          <section className="card-surface p-6">
            <h2 className="font-serif text-lg">Marketplace links</h2>
            <p className="mt-1 text-sm text-ink/50">Paste the URL where customers can buy this piece. Leave blank if not listed.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="ebay">eBay URL</label>
                <input id="ebay" className="input" value={form.ebayUrl} onChange={(e) => set('ebayUrl', e.target.value)} placeholder="https://www.ebay.co.uk/itm/…" />
              </div>
              <div>
                <label className="field-label" htmlFor="tiktok">TikTok URL</label>
                <input id="tiktok" className="input" value={form.tiktokUrl} onChange={(e) => set('tiktokUrl', e.target.value)} placeholder="https://www.tiktok.com/…" />
              </div>
              <div>
                <label className="field-label" htmlFor="facebook">Facebook Marketplace URL</label>
                <input id="facebook" className="input" value={form.facebookUrl} onChange={(e) => set('facebookUrl', e.target.value)} placeholder="https://www.facebook.com/marketplace/…" />
              </div>
              <div>
                <label className="field-label" htmlFor="instagram">Instagram URL</label>
                <input id="instagram" className="input" value={form.instagramUrl} onChange={(e) => set('instagramUrl', e.target.value)} placeholder="https://www.instagram.com/…" />
              </div>
            </div>
          </section>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <section className="card-surface space-y-5 p-6">
            <h2 className="font-serif text-lg">Visibility</h2>
            <Toggle
              label="Visible on site"
              hint="Show this product on the public website."
              checked={form.visible}
              onChange={(v) => set('visible', v)}
            />
            <Toggle
              label="Featured"
              hint="Highlight on the homepage."
              checked={form.featured}
              onChange={(v) => set('featured', v)}
            />
          </section>

          <section className="card-surface p-6">
            <h2 className="font-serif text-lg">Risk level</h2>
            <p className="mt-1 text-xs text-ink/45">Admin only — never shown publicly.</p>
            <select
              className="input mt-4"
              value={form.riskLevel}
              onChange={(e) => set('riskLevel', e.target.value as RiskLevel)}
            >
              <option value="safe">Safe — sell anywhere (incl. TikTok Shop)</option>
              <option value="risky">Risky — eBay / Facebook only</option>
              <option value="bundle">Bundle / Mystery box</option>
            </select>
          </section>

          {isEdit && (
            <button
              type="button"
              onClick={remove}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 px-6 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={16} /> Delete product
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
