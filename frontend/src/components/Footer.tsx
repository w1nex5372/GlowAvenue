import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Music2, Facebook, Mail } from 'lucide-react';
import Logo from './Logo';
import { useSettings } from '../lib/SettingsContext';
import { api } from '../lib/api';

export default function Footer() {
  const settings = useSettings();
  const year = new Date().getFullYear();
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    api.getProducts()
      .then((products) => {
        const cats = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
        setCategories(cats);
      })
      .catch(() => {});
  }, []);

  const socials = [
    { url: settings.instagramUrl, icon: Instagram, label: 'Instagram' },
    { url: settings.tiktokUrl, icon: Music2, label: 'TikTok' },
    { url: settings.facebookUrl, icon: Facebook, label: 'Facebook' },
  ].filter((s) => s.url);

  return (
    <footer className="bg-ink text-cream">
      <div className="container-luxe grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link to="/" className="inline-block text-gold" aria-label="GlamAvenue home">
            <Logo variant="inline" tagline />
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/70">
            {settings.heroSubtitle}
          </p>
        </div>

        <div>
          <h4 className="text-sm uppercase tracking-luxe text-gold">Explore</h4>
          <ul className="mt-5 space-y-3 text-sm text-cream/75">
            <li><Link to="/collection" className="transition hover:text-gold">Collection</Link></li>
            <li><Link to="/about" className="transition hover:text-gold">About</Link></li>
            <li><Link to="/contact" className="transition hover:text-gold">Contact</Link></li>
          </ul>
        </div>

        {categories.length > 0 && (
          <div>
            <h4 className="text-sm uppercase tracking-luxe text-gold">Browse</h4>
            <ul className="mt-5 space-y-3 text-sm text-cream/75">
              {categories.map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/collection?category=${encodeURIComponent(cat)}`}
                    className="transition hover:text-gold"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h4 className="text-sm uppercase tracking-luxe text-gold">Stay in touch</h4>
          {settings.contactEmail && (
            <a
              href={`mailto:${settings.contactEmail}`}
              className="mt-5 inline-flex items-center gap-2 text-sm text-cream/75 transition hover:text-gold"
            >
              <Mail size={16} /> {settings.contactEmail}
            </a>
          )}
          {socials.length > 0 && (
            <div className="mt-5 flex gap-4">
              {socials.map(({ url, icon: Icon, label }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-cream/80 transition hover:border-gold hover:text-gold"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          )}
          {settings.shippingText && (
            <p className="mt-6 text-xs leading-relaxed text-cream/55">{settings.shippingText}</p>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-luxe flex flex-col items-center justify-between gap-2 py-6 text-xs text-cream/50 sm:flex-row">
          <span>© {year} {settings.storeName || 'GlamAvenue'}. All rights reserved.</span>
          <span className="uppercase tracking-luxe">Timeless Elegance</span>
        </div>
      </div>
    </footer>
  );
}
