import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Settings as SettingsIcon, ExternalLink, LogOut } from 'lucide-react';
import { auth } from '../lib/auth';
import Logo from '../components/Logo';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon, end: false },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = () => {
    auth.clear();
    navigate('/admin/login', { replace: true });
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
      isActive ? 'bg-gold/15 text-gold' : 'text-cream/70 hover:bg-white/5 hover:text-cream'
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <aside className="flex shrink-0 flex-col bg-ink text-cream md:w-64">
        <div className="border-b border-white/10 px-6 py-5 text-gold">
          <Logo variant="inline" />
        </div>
        <nav className="flex flex-1 flex-row gap-1 overflow-x-auto p-3 md:flex-col">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-cream/70 transition hover:bg-white/5 hover:text-cream"
          >
            <ExternalLink size={18} /> View site
          </a>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-cream/70 transition hover:bg-white/5 hover:text-cream"
          >
            <LogOut size={18} /> Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
