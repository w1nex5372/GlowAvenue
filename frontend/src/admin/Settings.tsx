import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Check } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Settings } from '../lib/types';
import Loader from '../components/Loader';

interface FieldDef {
  key: string;
  label: string;
  hint?: string;
  type?: 'text' | 'textarea';
}

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: 'Brand',
    fields: [
      { key: 'storeName', label: 'Store name' },
      { key: 'tagline', label: 'Tagline' },
    ],
  },
  {
    title: 'Homepage hero',
    fields: [
      { key: 'heroTitle', label: 'Hero title' },
      { key: 'heroSubtitle', label: 'Hero subtitle', type: 'textarea' },
      { key: 'bannerText', label: 'Top banner text', hint: 'Shown in the gold strip above the header.' },
    ],
  },
  {
    title: 'Contact & shipping',
    fields: [
      { key: 'contactEmail', label: 'Contact email' },
      { key: 'shippingText', label: 'Shipping text', type: 'textarea' },
    ],
  },
  {
    title: 'Social & marketplace links',
    fields: [
      { key: 'instagramUrl', label: 'Instagram URL' },
      { key: 'tiktokUrl', label: 'TikTok URL' },
      { key: 'facebookUrl', label: 'Facebook URL' },
      { key: 'ebayStoreUrl', label: 'eBay Store URL' },
    ],
  },
];

export default function AdminSettings() {
  const navigate = useNavigate();
  const [values, setValues] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .adminGetSettings()
      .then(setValues)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) navigate('/admin/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const set = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await api.adminUpdateSettings(values);
      setValues(updated);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/admin/login');
      else setError(err instanceof ApiError ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading settings…" />;

  return (
    <form onSubmit={submit}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-ink/55">Store content shown across the public website.</p>
        </div>
        <button type="submit" className="btn-gold" disabled={saving}>
          {saved ? <Check size={18} /> : <Save size={18} />}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save settings'}
        </button>
      </div>

      {error && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 space-y-6">
        {SECTIONS.map((section) => (
          <section key={section.title} className="card-surface p-6">
            <h2 className="font-serif text-lg">{section.title}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label className="field-label" htmlFor={field.key}>{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.key}
                      className="input min-h-[90px] resize-y"
                      value={values[field.key] ?? ''}
                      onChange={(e) => set(field.key, e.target.value)}
                    />
                  ) : (
                    <input
                      id={field.key}
                      className="input"
                      value={values[field.key] ?? ''}
                      onChange={(e) => set(field.key, e.target.value)}
                    />
                  )}
                  {field.hint && <p className="mt-1 text-xs text-ink/40">{field.hint}</p>}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </form>
  );
}
