const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('pos_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Products API
export const productsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any[]>(`/products${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/products/${id}`),
  create: (data: any) =>
    fetchApi<any>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<any>(`/products/${id}`, {
      method: 'DELETE',
    }),
  getLowStock: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any[]>(`/products/low-stock${query}`);
  },
  getStockSummary: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any>(`/products/stock-summary${query}`);
  },
  getCategories: () => fetchApi<string[]>('/products/categories'),
  updateStock: (id: string, data: { quantity: number; operation: string }) =>
    fetchApi<any>(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Customers API
export const customersApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any[]>(`/customers${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/customers/${id}`),
  create: (data: any) =>
    fetchApi<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<any>(`/customers/${id}`, {
      method: 'DELETE',
    }),
  receivePayment: (id: string, amount: number) =>
    fetchApi<any>(`/customers/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ amount }),
    }),
  getSummary: () => fetchApi<any>('/customers/summary'),
  linkSupplier: (id: string, supplierId: string | null) =>
    fetchApi<any>(`/customers/${id}/link-supplier`, {
      method: 'PATCH',
      body: JSON.stringify({ supplierId }),
    }),
};

// Suppliers API
export const suppliersApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any[]>(`/suppliers${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/suppliers/${id}`),
  create: (data: any) =>
    fetchApi<any>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<any>(`/suppliers/${id}`, {
      method: 'DELETE',
    }),
  makePayment: (id: string, amount: number) =>
    fetchApi<any>(`/suppliers/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ amount }),
    }),
  getSummary: () => fetchApi<any>('/suppliers/summary'),
  linkCustomer: (id: string, customerId: string | null) =>
    fetchApi<any>(`/suppliers/${id}/link-customer`, {
      method: 'PATCH',
      body: JSON.stringify({ customerId }),
    }),
  settleLinkedBalance: (id: string) =>
    fetchApi<any>(`/suppliers/${id}/settle`, {
      method: 'POST',
    }),
};

// Sales API
export const salesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any[]>(`/sales${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/sales/${id}`),
  create: (data: any) =>
    fetchApi<any>('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePayment: (id: string, data: { amount: number; paymentMode?: string }) =>
    fetchApi<any>(`/sales/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  cancel: (id: string) =>
    fetchApi<any>(`/sales/${id}/cancel`, {
      method: 'PATCH',
    }),
  delete: (id: string) =>
    fetchApi<any>(`/sales/${id}`, {
      method: 'DELETE',
    }),
  getSummary: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any>(`/sales/summary${query}`);
  },
  getReceivables: () => fetchApi<any>('/sales/receivables'),
  getTrend: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any[]>(`/sales/trend${query}`);
  },
};

// Sale Returns API
export const saleReturnsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any[]>(`/sale-returns${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/sale-returns/${id}`),
  create: (data: any) =>
    fetchApi<any>('/sale-returns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<any>(`/sale-returns/${id}`, {
      method: 'DELETE',
    }),
  getSummary: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any>(`/sale-returns/summary${query}`);
  },
};

// Purchases API
export const purchasesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any[]>(`/purchases${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/purchases/${id}`),
  create: (data: any) =>
    fetchApi<any>('/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePayment: (id: string, amount: number) =>
    fetchApi<any>(`/purchases/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ amount }),
    }),
  cancel: (id: string) =>
    fetchApi<any>(`/purchases/${id}/cancel`, {
      method: 'PATCH',
    }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<any>(`/purchases/${id}`, {
      method: 'DELETE',
    }),
  getSummary: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any>(`/purchases/summary${query}`);
  },
  getPayables: () => fetchApi<any>('/purchases/payables'),
};

// Expenses API
export const expensesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any[]>(`/expenses${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/expenses/${id}`),
  create: (data: any) =>
    fetchApi<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<any>(`/expenses/${id}`, {
      method: 'DELETE',
    }),
  getSummary: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any>(`/expenses/summary${query}`);
  },
};

// Owners API
export const ownersApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any[]>(`/owners${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/owners/${id}`),
  create: (data: any) =>
    fetchApi<any>('/owners', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/owners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<any>(`/owners/${id}`, {
      method: 'DELETE',
    }),
};

// Investments API
export const investmentsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any[]>(`/investments${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/investments/${id}`),
  create: (data: any) =>
    fetchApi<any>('/investments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/investments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<any>(`/investments/${id}`, {
      method: 'DELETE',
    }),
  getSummary: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any>(`/investments/summary${query}`);
  },
};

// Other Income API
export const otherIncomeApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any[]>(`/other-income${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/other-income/${id}`),
  create: (data: any) =>
    fetchApi<any>('/other-income', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/other-income/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<any>(`/other-income/${id}`, {
      method: 'DELETE',
    }),
  getSummary: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any>(`/other-income/summary${query}`);
  },
};

// Purchase Returns API
export const purchaseReturnsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any[]>(`/purchase-returns${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/purchase-returns/${id}`),
  create: (data: any) =>
    fetchApi<any>('/purchase-returns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<any>(`/purchase-returns/${id}`, {
      method: 'DELETE',
    }),
  getSummary: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any>(`/purchase-returns/summary${query}`);
  },
  getReturnedQuantities: (purchaseId: string) =>
    fetchApi<any>(`/purchase-returns/returned-quantities/${purchaseId}`),
};

// Dashboard API
export const dashboardApi = {
  getCashInHand: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any>(`/dashboard/cash-in-hand${query}`);
  },
};

// Settings API
export const settingsApi = {
  getShopProfile: () => fetchApi<any>('/settings/shop-profile'),
  saveShopProfile: (data: any) =>
    fetchApi<any>('/settings/shop-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    fetchApi<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => fetchApi<any>('/auth/me'),
};

// Users API (superadmin)
export const usersApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any[]>(`/users${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/users/${id}`),
  create: (data: any) =>
    fetchApi<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<any>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// Activity logs API (admin / superadmin)
export const activityLogsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<any[]>(`/activity-logs${query}`);
  },
};

// Health Check
export const healthCheck = () => fetchApi<any>('/health');
