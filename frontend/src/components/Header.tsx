import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import { useSettings } from '../lib/SettingsContext';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/collection', label: 'Collection' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const settings = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {settings.bannerText && (
        <div className="bg-gold text-center text-[0.7rem] font-medium uppercase tracking-luxe text-ink">
          <div className="container-luxe py-2">{settings.bannerText}</div>
        </div>
      )}

      <div className="bg-ink text-cream">
        <div className="container-luxe flex h-20 items-center justify-between">
          <Link to="/" className="text-gold transition hover:opacity-90" aria-label="GlamAvenue home">
            <Logo variant="inline" />
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `text-sm tracking-wide transition-colors hover:text-gold ${
                    isActive ? 'text-gold' : 'text-cream/85'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/collection" className="btn-gold !py-2.5">
              Shop the Collection
            </Link>
          </nav>

          <button
            type="button"
            className="text-cream md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-white/10 md:hidden"
            >
              <div className="container-luxe flex flex-col py-4">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `py-3 text-sm tracking-wide transition-colors ${
                        isActive ? 'text-gold' : 'text-cream/85'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
