export type RiskLevel = 'safe' | 'risky' | 'bundle';
export type ProductStatus = 'draft' | 'published' | 'out_of_stock' | 'archived';
export type StockStatus = 'In stock' | 'Low stock' | 'Out of stock';

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
  shortDescription?: string | null;
  fullDescription?: string | null;
  features: string[];
  careGuide?: string | null;
  shippingInfo?: string | null;
  dimensions?: string | null;
  weight?: string | null;
  internalNotes?: string | null;
  status: ProductStatus;
  images: string[];
  ebayUrl?: string | null;
  tiktokUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  /** Admin-only fields (never returned by public endpoints). */
  riskLevel?: RiskLevel;
  visible?: boolean;
  featured: boolean;
  stockStatus: StockStatus;
  imagesComplete: boolean;
  marketplaceComplete: boolean;
  websiteReady: boolean;
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
  shortDescription: string;
  fullDescription: string;
  features: string[];
  careGuide: string;
  shippingInfo: string;
  dimensions: string;
  weight: string;
  internalNotes: string;
  status: ProductStatus;
  images: string[];
  ebayUrl: string;
  tiktokUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  riskLevel: RiskLevel;
  featured: boolean;
}
