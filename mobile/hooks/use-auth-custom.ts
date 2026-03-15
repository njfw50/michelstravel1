import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import { apiClient } from '@/lib/api-client';
import { AuthMethod, CustomerDevice, CustomerProfile, User } from '@/types';

type AuthArgs = {
  method: AuthMethod;
  identifier: string;
  password: string;
};

type RegisterArgs = AuthArgs & {
  firstName: string;
  lastName?: string;
};

interface AuthState {
  user: User | null;
  profile: CustomerProfile | null;
  device: CustomerDevice | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (input: AuthArgs) => Promise<void>;
  register: (input: RegisterArgs) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

async function persistIdentity(identity: {
  user: User;
  profile: CustomerProfile;
  device: CustomerDevice | null;
}) {
  await SecureStore.setItemAsync('customerUser', JSON.stringify(identity.user));
  await SecureStore.setItemAsync('customerProfile', JSON.stringify(identity.profile));
  await SecureStore.setItemAsync('customerDevice', JSON.stringify(identity.device));
}

async function clearIdentity() {
  await SecureStore.deleteItemAsync('customerUser');
  await SecureStore.deleteItemAsync('customerProfile');
  await SecureStore.deleteItemAsync('customerDevice');
}

export const useAuthCustom = create<AuthState>((set) => ({
  user: null,
  profile: null,
  device: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (input) => {
    try {
      set({ isLoading: true, error: null });

      const data = await apiClient.login(input);
      await persistIdentity(data);

      set({
        user: data.user,
        profile: data.profile,
        device: data.device,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error?.response?.data?.error || error?.message || 'Erro ao entrar',
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  register: async (input) => {
    try {
      set({ isLoading: true, error: null });

      const data = await apiClient.register(input);
      await persistIdentity(data);

      set({
        user: data.user,
        profile: data.profile,
        device: data.device,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error?.response?.data?.error || error?.message || 'Erro ao criar conta',
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await apiClient.logout();
    } catch {
      await apiClient.clearTokens();
    } finally {
      await clearIdentity();
      set({
        user: null,
        profile: null,
        device: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });

      const accessToken = await SecureStore.getItemAsync('accessToken');
      if (!accessToken) {
        await clearIdentity();
        set({
          user: null,
          profile: null,
          device: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      const identity = await apiClient.getCurrentCustomer();
      await persistIdentity(identity);

      set({
        user: identity.user,
        profile: identity.profile,
        device: identity.device,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      await apiClient.clearTokens();
      await clearIdentity();
      set({
        user: null,
        profile: null,
        device: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
