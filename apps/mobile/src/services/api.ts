import axios, { InternalAxiosRequestConfig } from 'axios';
import { CONFIG } from '../constants/config';
import { useAuthStore, getStoredRefreshToken } from '../store/auth.store';

export const api = axios.create({
  baseURL: `${CONFIG.API_URL}/api`,
  timeout: 15000,
});

// Attach Bearer token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await getStoredRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${CONFIG.API_URL}/api/auth/refresh`, {
          refreshToken,
        });
        await useAuthStore.getState().setTokens(data.accessToken, data.refreshToken ?? refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
