import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldAlert,
  Star,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Product } from '../lib/types';
import Loader from '../components/Loader';

const LOW_STOCK_THRESHOLD = 3;

export default function Dashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .adminGetProducts()
      .then(setProducts)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) navigate('/admin/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <Loader label="Loading dashboard…" />;

  const stats = [
    { label: 'Total products', value: products.length, icon: Package, tone: 'text-ink' },
    { label: 'Visible', value: products.filter((p) => p.visible).length, icon: Eye, tone: 'text-green-700' },
    { label: 'Hidden', value: products.filter((p) => !p.visible).length, icon: EyeOff, tone: 'text-ink/60' },
    {
      label: 'Low stock',
      value: products.filter((p) => p.quantity <= LOW_STOCK_THRESHOLD).length,
      icon: AlertTriangle,
      tone: 'text-amber-600',
    },
    { label: 'Risky', value: products.filter((p) => p.riskLevel === 'risky').length, icon: ShieldAlert, tone: 'text-red-600' },
    { label: 'Featured', value: products.filter((p) => p.featured).length, icon: Star, tone: 'text-gold-dark' },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-ink/55">Overview of your GlamAvenue catalog.</p>
        </div>
        <Link to="/admin/products/new" className="btn-gold">
          <Plus size={18} /> Add product
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card-surface p-5">
            <Icon size={20} className={tone} />
            <p className="mt-3 font-serif text-3xl">{value}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-ink/50">{label}</p>
          </div>
        ))}
      </div>

      <div className="card-surface mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <h2 className="font-serif text-lg">Recent products</h2>
          <Link to="/admin/products" className="inline-flex items-center gap-1 text-sm text-gold-dark hover:text-gold">
            Manage all <ArrowRight size={15} />
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="px-6 py-12 text-center text-ink/50">
            <p>No products yet.</p>
            <Link to="/admin/products/new" className="btn-gold mt-4">
              <Plus size={18} /> Add your first product
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-ink/5">
            {products.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-6 py-3">
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-cream">
                  {p.images?.[0] && (
                    <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-ink/50">{p.category} · {p.sku}</p>
                </div>
                <Link to={`/admin/products/${p.id}/edit`} className="text-sm text-gold-dark hover:text-gold">
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
