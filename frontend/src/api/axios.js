/**
 * Axios instance configured with JWT authentication interceptors.
 * 
 * This is the same pattern Munira used in BTTS (Zemen Bus Tracking System):
 * - Attaches access token to every request
 * - Intercepts 401 responses
 * - Attempts token refresh automatically
 * - Redirects to login if refresh fails
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach access token ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('invoicehub_access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 and refresh token ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already tried refreshing
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('invoicehub_refresh');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('invoicehub_access', access);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed — clear tokens and redirect to login
          localStorage.removeItem('invoicehub_access');
          localStorage.removeItem('invoicehub_refresh');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token — redirect to login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
