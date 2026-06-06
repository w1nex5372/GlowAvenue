export type RiskLevel = 'safe' | 'risky' | 'bundle';

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  quantity: number;
  material: string;
  description: string;
  images: string[];
  ebayUrl?: string | null;
  tiktokUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  /** Admin-only fields (never returned by public endpoints). */
  riskLevel?: RiskLevel;
  visible?: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Settings = Record<string, string>;

export interface ProductFormValues {
  name: string;
  sku: string;
  category: string;
  price: string;
  quantity: string;
  material: string;
  description: string;
  images: string[];
  ebayUrl: string;
  tiktokUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  riskLevel: RiskLevel;
  visible: boolean;
  featured: boolean;
}
