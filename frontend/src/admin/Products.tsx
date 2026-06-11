import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Archive, Check, Copy, Download, ExternalLink, Pencil, Plus, Search, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Product, ProductStatus, StockStatus } from '../lib/types';
import { formatPrice } from '../lib/format';
import Loader from '../components/Loader';

const STATUS_STYLE: Record<ProductStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-green-100 text-green-700',
  out_of_stock: 'bg-red-100 text-red-700',
  archived: 'bg-ink/10 text-ink/60',
};

const STOCK_STYLE: Record<StockStatus, string> = {
  'In stock': 'bg-green-100 text-green-700',
  'Low stock': 'bg-amber-100 text-amber-700',
  'Out of stock': 'bg-red-100 text-red-700',
};

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [status, setStatus] = useState('');
  const [missingImages, setMissingImages] = useState(false);
  const [missingLinks, setMissingLinks] = useState(false);
  const [working, setWorking] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.adminGetProducts().then(setProducts).catch((err) => {
      if (err instanceof ApiError && err.status === 401) navigate('/admin/login');
    }).finally(() => setLoading(false));
  };
  useEffect(load, [navigate]);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(), [products]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) =>
      (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
      (!category || p.category === category) &&
      (!stock || p.stockStatus === stock) &&
      (!status || p.status === status) &&
      (!missingImages || !p.imagesComplete) &&
      (!missingLinks || !p.marketplaceComplete),
    );
  }, [products, query, category, stock, status, missingImages, missingLinks]);

  const archive = async (product: Product) => {
    if (!window.confirm(`Archive "${product.name}"?`)) return;
    setWorking(product.id);
    try {
      const updated = await api.adminArchiveProduct(product.id);
      setProducts((items) => items.map((item) => item.id === product.id ? updated : item));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to archive product');
    } finally {
      setWorking(null);
    }
  };

  const exportCsv = async () => {
    try {
      const blob = await api.adminExportProducts();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'glamavenue-products.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to export products');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="font-serif text-3xl">Products</h1><p className="mt-1 text-sm text-ink/55">{filtered.length} shown · {products.length} total</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} className="btn-outline"><Download size={17} /> Export CSV</button>
          <Link to="/admin/products/new" className="btn-gold"><Plus size={18} /> Add product</Link>
        </div>
      </div>

      <div className="card-surface mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" /><input className="input pl-9" placeholder="Search SKU or name..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select>
        <select className="input" value={stock} onChange={(e) => setStock(e.target.value)}><option value="">All stock</option><option>In stock</option><option>Low stock</option><option>Out of stock</option></select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="out_of_stock">Out of stock</option><option value="archived">Archived</option></select>
        <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-ink/65">
          <label className="flex items-center gap-2"><input type="checkbox" checked={missingImages} onChange={(e) => setMissingImages(e.target.checked)} /> Missing images</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={missingLinks} onChange={(e) => setMissingLinks(e.target.checked)} /> Missing links</label>
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="card-surface mt-6 overflow-x-auto">
          <table className="w-full min-w-[1800px] text-left text-sm">
            <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/45">
              <tr>{['Cover', 'SKU', 'Name', 'Category', 'Price', 'Quantity', 'Stock Status', 'Product Status', 'Website', 'eBay', 'TikTok', 'Facebook', 'Instagram', 'Last updated', 'Actions'].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-cream/50">
                  <td className="px-3 py-3"><span className="block h-12 w-12 overflow-hidden rounded-lg bg-cream">{p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}</span></td>
                  <td className="px-3 py-3 font-medium">{p.sku || '—'}</td>
                  <td className="max-w-56 px-3 py-3"><span className="block truncate font-medium">{p.name || 'Untitled draft'}</span><div className="mt-1 flex gap-1"><Indicator label="4+ images" ready={p.imagesComplete} /><Indicator label="Markets" ready={p.marketplaceComplete} /></div></td>
                  <td className="px-3 py-3 text-ink/60">{p.category || '—'}</td>
                  <td className="px-3 py-3">{formatPrice(p.price)}</td>
                  <td className="px-3 py-3">{p.quantity}</td>
                  <td className="px-3 py-3"><Badge label={p.stockStatus} style={STOCK_STYLE[p.stockStatus]} /></td>
                  <td className="px-3 py-3"><Badge label={p.status.replace(/_/g, ' ')} style={STATUS_STYLE[p.status]} /></td>
                  <td className="px-3 py-3"><WebsiteState ready={p.websiteReady} live={Boolean(p.visible)} href={`/product/${p.slug}`} /></td>
                  <td className="px-3 py-3"><ReadyLink ready={Boolean(p.ebayUrl)} href={p.ebayUrl} /></td>
                  <td className="px-3 py-3"><ReadyLink ready={Boolean(p.tiktokUrl)} href={p.tiktokUrl} /></td>
                  <td className="px-3 py-3"><ReadyLink ready={Boolean(p.facebookUrl)} href={p.facebookUrl} /></td>
                  <td className="px-3 py-3"><ReadyLink ready={Boolean(p.instagramUrl)} href={p.instagramUrl} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-ink/55">{new Date(p.updatedAt).toLocaleDateString()}</td>
                  <td className="px-3 py-3"><div className="flex gap-1">
                    <Link to={`/admin/products/${p.id}/edit`} className="rounded-lg p-2 text-ink/60 hover:bg-gold/15 hover:text-gold-dark" title="Edit"><Pencil size={16} /></Link>
                    <Link to={`/admin/products/new?duplicate=${p.id}`} className="rounded-lg p-2 text-ink/60 hover:bg-gold/15 hover:text-gold-dark" title="Duplicate"><Copy size={16} /></Link>
                    {p.status !== 'archived' && <button type="button" onClick={() => archive(p)} disabled={working === p.id} className="rounded-lg p-2 text-ink/60 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-40" title="Archive"><Archive size={16} /></button>}
                  </div></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={15} className="px-4 py-12 text-center text-ink/50">No products found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Badge({ label, style }: { label: string; style: string }) {
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium capitalize ${style}`}>{label}</span>;
}

function Indicator({ label, ready }: { label: string; ready: boolean }) {
  return <span title={label} className={`rounded px-1.5 py-0.5 text-[10px] ${ready ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{ready ? '✓' : '!'}</span>;
}

function ReadyLink({ ready, href }: { ready: boolean; href?: string | null }) {
  return ready && href ? <a href={href} target="_blank" rel="noreferrer" className="inline-flex rounded p-1 text-green-700 hover:bg-green-50"><ExternalLink size={15} /></a> : ready ? <Check size={15} className="text-green-700" /> : <X size={15} className="text-ink/25" />;
}

function WebsiteState({ ready, live, href }: { ready: boolean; live: boolean; href: string }) {
  if (live) {
    return <a href={href} target="_blank" rel="noreferrer" title={ready ? 'Live and website ready' : 'Live legacy product'} className="inline-flex rounded p-1 text-green-700 hover:bg-green-50"><ExternalLink size={15} /></a>;
  }
  return <span title={ready ? 'Website ready, not published' : 'Not website ready'} className={`inline-flex rounded p-1 ${ready ? 'text-amber-600' : 'text-ink/25'}`}>{ready ? <Check size={15} /> : <X size={15} />}</span>;
}
