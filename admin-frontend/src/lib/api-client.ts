import axios from 'axios';

// Base API instance for admin-service BFF
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ADMIN_BFF_URL || 'https://backendadmin.niklo.co/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for error handling and standard payload unwrapping
apiClient.interceptors.response.use(
  (response) => {
    // Automatically unwrap standard backend responses: { success: true, statusCode: 200, data: ... }
    if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
