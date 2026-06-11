import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { Archive, ArrowLeft, Copy, Save, Sparkles, Trash2, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { ImageReadiness, ProductFormValues, ProductStatus, RiskLevel, StockStatus } from '../lib/types';
import ImageUploader from './ImageUploader';
import Loader from '../components/Loader';

const COMMON_CATEGORIES = ['Bracelets', 'Necklaces', 'Earrings', 'Rings', 'Anklets', 'Sets', 'Bundles'];
const DEFAULT_CARE = 'Avoid water, perfumes and harsh chemicals. Store in a dry place and clean gently with a soft cloth.';
const DEFAULT_SHIPPING = 'Worldwide shipping available. Carefully packaged and dispatched as soon as possible.';

const EMPTY: ProductFormValues = {
  name: '',
  sku: '',
  category: '',
  price: '',
  quantity: '0',
  material: '18k Gold Plated Stainless Steel',
  shortDescription: '',
  fullDescription: '',
  features: [],
  careGuide: DEFAULT_CARE,
  shippingInfo: DEFAULT_SHIPPING,
  dimensions: '',
  weight: '',
  internalNotes: '',
  status: 'draft',
  images: [],
  ebayUrl: '',
  tiktokUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  riskLevel: 'safe',
  featured: false,
};

const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  out_of_stock: 'Out of stock',
  archived: 'Archived',
};

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="card-surface p-6">
      <h2 className="font-serif text-lg">{title}</h2>
      {hint && <p className="mt-1 text-sm text-ink/50">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function stockStatus(quantity: string): StockStatus {
  const value = Number(quantity);
  if (value <= 0) return 'Out of stock';
  if (value <= 2) return 'Low stock';
  return 'In stock';
}

function StockBadge({ value }: { value: StockStatus }) {
  const style = value === 'In stock' ? 'bg-green-100 text-green-700' : value === 'Low stock' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${style}`}>{value}</span>;
}

function imageReadiness(count: number): ImageReadiness {
  if (count === 0) return 'Missing';
  if (count === 1) return 'Partial';
  if (count >= 4) return 'Premium';
  return 'Ready';
}

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<ProductFormValues>(EMPTY);
  const [loading, setLoading] = useState(isEdit || Boolean(duplicateId));
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState('');
  const [legacyPublished, setLegacyPublished] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const request = id ? api.adminGetProduct(id) : duplicateId ? api.adminDuplicateProduct(duplicateId) : null;
    if (!request) return;
    request
      .then((p) => {
        if ('websiteReady' in p) setLegacyPublished(p.status === 'published' && !p.websiteReady);
        setForm({
        name: p.name,
        sku: p.sku,
        category: p.category,
        price: String(p.price),
        quantity: String(p.quantity),
        material: p.material,
        shortDescription: p.shortDescription ?? '',
        fullDescription: p.fullDescription ?? ('description' in p ? p.description : ''),
        features: p.features ?? [],
        careGuide: p.careGuide ?? DEFAULT_CARE,
        shippingInfo: p.shippingInfo ?? DEFAULT_SHIPPING,
        dimensions: p.dimensions ?? '',
        weight: p.weight ?? '',
        internalNotes: p.internalNotes ?? '',
        status: p.status ?? 'draft',
        images: p.images ?? [],
        ebayUrl: p.ebayUrl ?? '',
        tiktokUrl: p.tiktokUrl ?? '',
        facebookUrl: p.facebookUrl ?? '',
        instagramUrl: p.instagramUrl ?? '',
        riskLevel: p.riskLevel ?? 'safe',
        featured: p.featured ?? false,
        });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) navigate('/admin/login');
        else setError('Could not load this product.');
      })
      .finally(() => setLoading(false));
  }, [id, duplicateId, navigate]);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const publishErrors = useMemo(() => {
    const missing: string[] = [];
    if (!form.name.trim()) missing.push('name');
    if (!form.sku.trim()) missing.push('SKU');
    if (!form.category.trim()) missing.push('category');
    if (Number(form.price) < 0 || form.price === '') missing.push('price');
    if (Number(form.quantity) < 0 || form.quantity === '') missing.push('quantity');
    if (!form.material.trim()) missing.push('material');
    if (!form.shortDescription.trim()) missing.push('short description');
    if (!form.fullDescription.trim()) missing.push('full description');
    if (form.images.length < 2) missing.push('at least 2 images');
    return missing;
  }, [form]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.status === 'draft' && form.images.length < 1) {
      setError('Draft products require at least 1 image.');
      return;
    }
    if (form.status === 'published' && publishErrors.length && !legacyPublished) {
      setError(`Cannot publish. Missing: ${publishErrors.join(', ')}.`);
      return;
    }
    setSaving(true);
    const payload = { ...form, price: Number(form.price) || 0, quantity: parseInt(form.quantity, 10) || 0 };
    try {
      if (isEdit && id) await api.adminUpdateProduct(id, payload);
      else await api.adminCreateProduct(payload);
      navigate('/admin/products');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/admin/login');
      else setError(err instanceof ApiError ? err.message : 'Failed to save product');
      setSaving(false);
    }
  };

  const archive = async () => {
    if (!id || !window.confirm(`Archive "${form.name}"?`)) return;
    try {
      await api.adminArchiveProduct(id);
      navigate('/admin/products');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to archive product');
    }
  };

  const deletePermanently = async () => {
    if (!id || deleteConfirmation !== 'DELETE') return;
    setDeleting(true);
    setError('');
    try {
      await api.adminDeleteProduct(id);
      navigate('/admin/products');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/admin/login');
      else setError(err instanceof ApiError ? err.message : 'Failed to delete product');
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const suggestSku = async () => {
    if (!form.category) {
      setError('Choose a category before suggesting an SKU.');
      return;
    }
    setSuggesting(true);
    setError('');
    try {
      const result = await api.adminSuggestSku(form.category);
      set('sku', result.sku);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not suggest an SKU');
    } finally {
      setSuggesting(false);
    }
  };

  if (loading) return <Loader label="Loading product..." />;
  const currentStock = stockStatus(form.quantity);

  return (
    <form onSubmit={submit}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/admin/products" className="inline-flex items-center gap-1 text-sm text-ink/50 hover:text-gold">
            <ArrowLeft size={15} /> Back to products
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl">{isEdit ? 'Edit product' : duplicateId ? 'Duplicate product' : 'New product'}</h1>
            <StockBadge value={currentStock} />
            <ProductStatusBadge value={form.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEdit && <Link to={`/admin/products/new?duplicate=${id}`} className="btn-outline"><Copy size={16} /> Duplicate</Link>}
          <button type="submit" className="btn-gold" disabled={saving}><Save size={18} /> {saving ? 'Saving...' : 'Save product'}</button>
        </div>
      </div>

      {error && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {form.status === 'published' && publishErrors.length > 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{legacyPublished ? 'This legacy published product can still be edited, but is not website-ready under the new rules. Missing: ' : 'Publishing requires: '}{publishErrors.join(', ')}.</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Basic Product Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" wide><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Celeste Gold Bracelet" /></Field>
              <Field label="SKU">
                <div className="flex gap-2"><input className="input" value={form.sku} onChange={(e) => set('sku', e.target.value.toUpperCase())} placeholder="GA-BR-0001" /><button type="button" onClick={suggestSku} disabled={suggesting} className="rounded-lg border border-gold/40 px-3 text-gold-dark hover:bg-gold/10" title="Suggest next SKU"><Sparkles size={17} /></button></div>
              </Field>
              <Field label="Category"><input className="input" list="category-options" value={form.category} onChange={(e) => set('category', e.target.value)} /><datalist id="category-options">{COMMON_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist></Field>
              <Field label="Price (£)"><input type="number" step="0.01" min="0" className="input" value={form.price} onChange={(e) => set('price', e.target.value)} /></Field>
              <Field label="Quantity"><input type="number" min="0" className="input" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} /></Field>
              <Field label="Material" wide><input className="input" value={form.material} onChange={(e) => set('material', e.target.value)} /></Field>
              <Field label="Status" wide><select className="input" value={form.status} onChange={(e) => set('status', e.target.value as ProductStatus)}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            </div>
          </Section>

          <Section title="Product Copy">
            <div className="space-y-4">
              <Field label="Short Description"><textarea className="input min-h-20 resize-y" value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} /></Field>
              <Field label="Full Description"><textarea className="input min-h-36 resize-y" value={form.fullDescription} onChange={(e) => set('fullDescription', e.target.value)} /></Field>
              <Field label="Features" hint="One feature per line"><textarea className="input min-h-28 resize-y" value={form.features.join('\n')} onChange={(e) => set('features', e.target.value.split(/\r?\n/))} /></Field>
              <Field label="Care Guide"><textarea className="input min-h-24 resize-y" value={form.careGuide} onChange={(e) => set('careGuide', e.target.value)} /></Field>
              <Field label="Shipping Info"><textarea className="input min-h-24 resize-y" value={form.shippingInfo} onChange={(e) => set('shippingInfo', e.target.value)} /></Field>
            </div>
          </Section>

          <Section title="Product Specs">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dimensions"><input className="input" value={form.dimensions} onChange={(e) => set('dimensions', e.target.value)} placeholder="Length 18cm + 5cm extender" /></Field>
              <Field label="Weight"><input className="input" value={form.weight} onChange={(e) => set('weight', e.target.value)} placeholder="12g" /></Field>
            </div>
          </Section>

          <Section title="Images" hint="1 image minimum for drafts, 2 for publishing, and 4 for Premium. First image is the cover.">
            <ImageUploader value={form.images} onChange={(urls) => set('images', urls)} />
          </Section>

          <Section title="Marketplace Links" hint="Leave blank if this product is not listed on a marketplace.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="eBay URL"><input className="input" value={form.ebayUrl} onChange={(e) => set('ebayUrl', e.target.value)} /></Field>
              <Field label="TikTok URL"><input className="input" value={form.tiktokUrl} onChange={(e) => set('tiktokUrl', e.target.value)} /></Field>
              <Field label="Facebook Marketplace URL"><input className="input" value={form.facebookUrl} onChange={(e) => set('facebookUrl', e.target.value)} /></Field>
              <Field label="Instagram URL"><input className="input" value={form.instagramUrl} onChange={(e) => set('instagramUrl', e.target.value)} /></Field>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Readiness">
            <div className="space-y-3 text-sm">
              <Readiness label="Website ready" ready={publishErrors.length === 0} />
              <ImageReadinessBadge value={imageReadiness(form.images.length)} />
              <Readiness label="Marketplace complete" ready={Boolean(form.ebayUrl && form.tiktokUrl && form.facebookUrl && form.instagramUrl)} />
            </div>
          </Section>
          <Section title="Internal">
            <Field label="Internal Notes"><textarea className="input min-h-32 resize-y" value={form.internalNotes} onChange={(e) => set('internalNotes', e.target.value)} /></Field>
            <div className="mt-4"><Field label="Risk level"><select className="input" value={form.riskLevel} onChange={(e) => set('riskLevel', e.target.value as RiskLevel)}><option value="safe">Safe</option><option value="risky">Risky</option><option value="bundle">Bundle / Mystery box</option></select></Field></div>
            <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured on homepage</label>
          </Section>
          {isEdit && <button type="button" onClick={archive} className="flex w-full items-center justify-center gap-2 rounded-full border border-amber-300 px-6 py-3 text-sm font-medium text-amber-700 hover:bg-amber-50"><Archive size={16} /> Archive product</button>}
          {isEdit && <button type="button" onClick={() => { setDeleteConfirmation(''); setDeleteOpen(true); }} className="flex w-full items-center justify-center gap-2 rounded-full border border-red-300 px-6 py-3 text-sm font-medium text-red-700 hover:bg-red-50"><Trash2 size={16} /> Delete permanently</button>}
        </div>
      </div>

      {deleteOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-product-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-product-title" className="font-serif text-xl">Delete product permanently?</h2>
                <p className="mt-2 text-sm text-red-700">This permanently removes the product and its uploaded images. This cannot be undone.</p>
              </div>
              <button type="button" onClick={() => setDeleteOpen(false)} disabled={deleting} aria-label="Close" className="rounded-lg p-1 text-ink/50 hover:bg-ink/5"><X size={18} /></button>
            </div>
            <label className="field-label mt-5">Type DELETE to confirm</label>
            <input
              className="input"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteOpen(false)} disabled={deleting} className="btn-outline">Cancel</button>
              <button type="button" onClick={deletePermanently} disabled={deleting || deleteConfirmation !== 'DELETE'} className="inline-flex items-center gap-2 rounded-full bg-red-700 px-6 py-3 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40">
                <Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: ReactNode }) {
  return <div className={wide ? 'sm:col-span-2' : ''}><label className="field-label">{label}</label>{children}{hint && <p className="mt-1 text-xs text-ink/45">{hint}</p>}</div>;
}

function Readiness({ label, ready }: { label: string; ready: boolean }) {
  return <div className="flex items-center justify-between gap-3"><span>{label}</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ready ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{ready ? 'Complete' : 'Missing'}</span></div>;
}

function ImageReadinessBadge({ value }: { value: ImageReadiness }) {
  const style = value === 'Premium'
    ? 'bg-gold/15 text-gold-dark'
    : value === 'Ready'
      ? 'bg-green-100 text-green-700'
      : value === 'Partial'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700';
  return <div className="flex items-center justify-between gap-3"><span>Images</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>{value}</span></div>;
}

function ProductStatusBadge({ value }: { value: ProductStatus }) {
  const style = value === 'published' ? 'bg-green-100 text-green-700' : value === 'archived' ? 'bg-ink/10 text-ink/60' : value === 'out_of_stock' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700';
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${style}`}>{STATUS_LABELS[value]}</span>;
}
