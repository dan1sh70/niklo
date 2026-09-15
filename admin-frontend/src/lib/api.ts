const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error ${res.status}`);
  }
  return res.json();
}

// ========== VENDORS ==========
export interface Vendor {
  id: string;
  company_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address?: string;
  gst_number?: string;
  status: string;
  plan?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export const vendorsApi = {
  findAll: () => apiFetch<Vendor[]>('/api/v1/admin/vendors'),
  findOne: (id: string) => apiFetch<Vendor>(`/api/v1/admin/vendors/${id}`),
  create: (data: Partial<Vendor>) => apiFetch<Vendor>('/api/v1/admin/vendors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Vendor>) => apiFetch<Vendor>(`/api/v1/admin/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/api/v1/admin/vendors/${id}`, { method: 'DELETE' }),
};

// ========== SUBSCRIPTIONS ==========
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const subscriptionsApi = {
  findAll: () => apiFetch<SubscriptionPlan[]>('/api/v1/admin/subscriptions'),
  findOne: (id: string) => apiFetch<SubscriptionPlan>(`/api/v1/admin/subscriptions/${id}`),
  create: (data: Partial<SubscriptionPlan>) => apiFetch<SubscriptionPlan>('/api/v1/admin/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<SubscriptionPlan>) => apiFetch<SubscriptionPlan>(`/api/v1/admin/subscriptions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/api/v1/admin/subscriptions/${id}`, { method: 'DELETE' }),
};

// ========== API KEYS ==========
export interface ApiKey {
  id: string;
  provider_name: string;
  api_key: string;
  api_secret?: string;
  sender_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const apiKeysApi = {
  findAll: () => apiFetch<ApiKey[]>('/api/v1/admin/api-keys'),
  findOne: (id: string) => apiFetch<ApiKey>(`/api/v1/admin/api-keys/${id}`),
  create: (data: Partial<ApiKey>) => apiFetch<ApiKey>('/api/v1/admin/api-keys', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<ApiKey>) => apiFetch<ApiKey>(`/api/v1/admin/api-keys/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/api/v1/admin/api-keys/${id}`, { method: 'DELETE' }),
};

// ========== PAYOUTS ==========
export interface Payout {
  id: string;
  vendor_id: string;
  amount: number;
  payment_method: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payment_details?: any;
  status: string;
  transaction_ref?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export const payoutsApi = {
  findAll: () => apiFetch<Payout[]>('/api/v1/admin/payouts'),
  findOne: (id: string) => apiFetch<Payout>(`/api/v1/admin/payouts/${id}`),
  create: (data: Partial<Payout>) => apiFetch<Payout>('/api/v1/admin/payouts', { method: 'POST', body: JSON.stringify(data) }),
  process: (id: string, data: { status: string; transaction_ref?: string; rejection_reason?: string }) =>
    apiFetch<Payout>(`/api/v1/admin/payouts/${id}/process`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/api/v1/admin/payouts/${id}`, { method: 'DELETE' }),
};

// ========== SEO BLOGS ==========
export interface SeoBlog {
  id: string;
  title: string;
  content: string;
  source_city?: string;
  destination_city?: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  cover_image_url?: string;
  is_published: boolean;
  views: number;
  seo_score: number;
  created_at: string;
  updated_at: string;
}

export const seoBlogsApi = {
  findAll: () => apiFetch<SeoBlog[]>('/api/v1/admin/seo/blogs'),
  findOne: (id: string) => apiFetch<SeoBlog>(`/api/v1/admin/seo/blogs/${id}`),
  create: (data: Partial<SeoBlog>) => apiFetch<SeoBlog>('/api/v1/admin/seo/blogs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<SeoBlog>) => apiFetch<SeoBlog>(`/api/v1/admin/seo/blogs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/api/v1/admin/seo/blogs/${id}`, { method: 'DELETE' }),
};

// ========== SALES / REFERRALS ==========
export interface Referral {
  id: string;
  sales_executive_id: string;
  referral_code: string;
  referred_user_id: string;
  total_revenue_generated: number;
  commission_earned: number;
  created_at: string;
  updated_at: string;
}

export const referralsApi = {
  findAll: () => apiFetch<Referral[]>('/api/v1/admin/sales/referrals'),
  findOne: (id: string) => apiFetch<Referral>(`/api/v1/admin/sales/referrals/${id}`),
  create: (data: Partial<Referral>) => apiFetch<Referral>('/api/v1/admin/sales/referrals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Referral>) => apiFetch<Referral>(`/api/v1/admin/sales/referrals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/api/v1/admin/sales/referrals/${id}`, { method: 'DELETE' }),
};
