import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';
import type { Settings } from './types';

const FALLBACK: Settings = {
  storeName: 'GlamAvenue',
  tagline: 'Timeless Elegance',
  heroTitle: 'Timeless Elegance, Everyday Luxury',
  heroSubtitle:
    'Affordable gold plated stainless steel jewellery, designed to last and made to shine.',
  bannerText: 'Free UK delivery on every order',
  shippingText: 'Ships from the UK · 2–4 working days · Tracked delivery',
  contactEmail: 'hello@glamavenue.co.uk',
  instagramUrl: '',
  tiktokUrl: '',
  facebookUrl: '',
  ebayStoreUrl: '',
};

const SettingsContext = createContext<Settings>(FALLBACK);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(FALLBACK);

  useEffect(() => {
    api
      .getSettings()
      .then((data) => setSettings({ ...FALLBACK, ...data }))
      .catch(() => {
        /* keep fallback settings if the API is unreachable */
      });
  }, []);

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  return useContext(SettingsContext);
}
