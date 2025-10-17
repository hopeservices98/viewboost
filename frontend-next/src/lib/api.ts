import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),

  register: (userData: {
    email: string;
    password: string;
    username: string;
    role: 'CREATOR' | 'AFFILIATE';
    referredBy?: string;
  }) =>
    api.post('/auth/register', userData),

  getProfile: () => api.get('/auth/profile'),
};

// Campaigns API
export const campaignsAPI = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/campaigns', { params }),

  getById: (id: string) => api.get(`/campaigns/${id}`),

  create: (campaignData: {
    title: string;
    description?: string;
    youtubeUrl: string;
    costPerView?: number;
    maxViews: number;
  }) => api.post('/campaigns', campaignData),

  update: (id: string, campaignData: Partial<any>) =>
    api.put(`/campaigns/${id}`, campaignData),

  delete: (id: string) => api.delete(`/campaigns/${id}`),
};

// Affiliate Links API
export const affiliateLinksAPI = {
  getUserLinks: (params?: { page?: number; limit?: number }) =>
    api.get('/affiliate-links', { params }),

  getById: (id: string) => api.get(`/affiliate-links/${id}`),

  createForCampaign: (campaignId: string) =>
    api.post(`/affiliate-links/campaigns/${campaignId}`),

  delete: (id: string) => api.delete(`/affiliate-links/${id}`),
};

// Commissions API
export const commissionsAPI = {
  getUserCommissions: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/commissions', { params }),

  getBalance: () => api.get('/commissions/balance'),

  getStats: () => api.get('/commissions/stats'),
};

// Payouts API
export const payoutsAPI = {
  getUserPayouts: (params?: { page?: number; limit?: number }) =>
    api.get('/payouts', { params }),

  requestPayout: (payoutData: {
    amount: number;
    method: 'PAYPAL' | 'BANK_TRANSFER' | 'CRYPTO';
    paypalEmail?: string;
    bankDetails?: string;
  }) => api.post('/payouts', payoutData),

  getStats: () => api.get('/payouts/stats'),
};

// Analytics API
export const analyticsAPI = {
  getDashboardStats: () => api.get('/analytics/dashboard'),

  getClicksStats: (params?: { days?: number }) =>
    api.get('/analytics/clicks', { params }),

  getViewsStats: (params?: { days?: number }) =>
    api.get('/analytics/views', { params }),

  getRevenueStats: (params?: { days?: number }) =>
    api.get('/analytics/revenue', { params }),
};

// AI API
export const aiAPI = {
  getRecommendations: (userData: any) =>
    api.post('/ai/recommendations', userData),

  detectFraud: (data: any) =>
    api.post('/ai/fraud-detection', data),

  getChatbotResponse: (message: string, context?: any) =>
    api.post('/ai/chatbot', { message, context }),
};

export default api;