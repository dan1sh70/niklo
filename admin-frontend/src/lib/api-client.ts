import axios from 'axios';

// Base API instance for admin-service BFF
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ADMIN_BFF_URL || 'http://localhost:3014/api/v1',
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

// Response interceptor for error handling (e.g., redirect to login on 401)
apiClient.interceptors.response.use(
  (response) => response,
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
