/**
 * Default store settings. The public + admin settings endpoints merge any
 * values saved in the database on top of these, so the site always renders
 * sensible content even before the partner edits anything.
 */
export const DEFAULT_SETTINGS: Record<string, string> = {
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

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);
