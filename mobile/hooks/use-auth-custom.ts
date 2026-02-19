import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '@/lib/api-client';
import { User, AuthTokens } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthCustom = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const tokens = await apiClient.login(email, password);
      
      // Buscar dados do usuário após login
      // TODO: Implementar endpoint /api/mobile/auth/me
      const mockUser: User = {
        id: '1',
        email,
        name: 'Admin',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };

      await SecureStore.setItemAsync('user', JSON.stringify(mockUser));
      
      set({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Erro ao fazer login',
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
      await SecureStore.deleteItemAsync('user');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      // Mesmo com erro, limpar estado local
      await SecureStore.deleteItemAsync('user');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const userJson = await SecureStore.getItemAsync('user');
      
      if (accessToken && userJson) {
        const user = JSON.parse(userJson);
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Check auth error:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
