import { create } from 'zustand';
import { Platform } from 'react-native';
import type { User } from '@poolify/shared';

const ACCESS_KEY = 'poolify_access_token';
const REFRESH_KEY = 'poolify_refresh_token';

// Cross-platform storage: SecureStore on native, localStorage on web
const storage = {
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    }
  },
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      const SecureStore = require('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    }
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      const SecureStore = require('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    }
  },
};

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: User) => void;
  loadFromStorage: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  setTokens: async (accessToken, refreshToken) => {
    await storage.set(ACCESS_KEY, accessToken);
    if (refreshToken) {
      await storage.set(REFRESH_KEY, refreshToken);
    }
    set({ accessToken, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  loadFromStorage: async () => {
    try {
      const accessToken = await storage.get(ACCESS_KEY);
      if (accessToken) {
        set({ accessToken, isAuthenticated: true });
      }
    } catch {
      // Storage not available — ignore
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await storage.remove(ACCESS_KEY).catch(() => {});
    await storage.remove(REFRESH_KEY).catch(() => {});
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));

export async function getStoredRefreshToken(): Promise<string | null> {
  try {
    return await storage.get(REFRESH_KEY);
  } catch {
    return null;
  }
}
