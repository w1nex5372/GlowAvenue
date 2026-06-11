import { auth } from './auth';
import type { Product, ProductFormValues, Settings } from './types';

const BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

type Body = Record<string, unknown> | undefined;

async function request<T>(
  method: string,
  path: string,
  body?: Body | FormData,
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // browser sets multipart boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });

  if (res.status === 401) {
    auth.clear();
  }

  if (!res.ok) {
    let message = res.statusText || 'Request failed';
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // --- Public ---
  getProducts: (category?: string) =>
    request<Product[]>('GET', `/products${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  getFeatured: () => request<Product[]>('GET', '/products/featured'),
  getProduct: (slug: string) => request<Product>('GET', `/products/${encodeURIComponent(slug)}`),
  getSettings: () => request<Settings>('GET', '/settings'),

  // --- Auth ---
  login: (email: string, password: string) =>
    request<{ token: string }>('POST', '/admin/login', { email, password }),

  // --- Admin: products ---
  adminGetProducts: () => request<Product[]>('GET', '/admin/products'),
  adminGetProduct: (id: string) => request<Product>('GET', `/admin/products/${id}`),
  adminCreateProduct: (data: Record<string, unknown>) =>
    request<Product>('POST', '/admin/products', data),
  adminUpdateProduct: (id: string, data: Record<string, unknown>) =>
    request<Product>('PUT', `/admin/products/${id}`, data),
  adminDeleteProduct: (id: string) => request<{ ok: boolean }>('DELETE', `/admin/products/${id}`),
  adminArchiveProduct: (id: string) => request<Product>('POST', `/admin/products/${id}/archive`),
  adminDuplicateProduct: (id: string) =>
    request<ProductFormValues>('GET', `/admin/products/${id}/duplicate`),
  adminSuggestSku: (category: string) =>
    request<{ sku: string }>('GET', `/admin/products/sku-suggestion?category=${encodeURIComponent(category)}`),
  adminExportProducts: async () => {
    const token = auth.getToken();
    const res = await fetch(`${BASE}/admin/products/export.csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status === 401) auth.clear();
    if (!res.ok) throw new ApiError(res.status, 'Failed to export products');
    return res.blob();
  },

  // --- Admin: settings ---
  adminGetSettings: () => request<Settings>('GET', '/admin/settings'),
  adminUpdateSettings: (data: Settings) => request<Settings>('PUT', '/admin/settings', data),

  // --- Admin: uploads ---
  upload: (files: File[]) => {
    const fd = new FormData();
    files.forEach((file) => fd.append('files', file));
    return request<{ urls: string[] }>('POST', '/admin/upload', fd);
  },
};
