import { create } from "zustand";

import { adminApiClient } from "@/lib/admin-api-client";

interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  expiresAt: number | null;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAdminAuth = create<AdminAuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  error: null,
  expiresAt: null,

  login: async (password: string) => {
    try {
      set({ isLoading: true, error: null });
      await adminApiClient.login(password);
      const session = await adminApiClient.me();
      set({
        isAuthenticated: Boolean(session.authenticated),
        isLoading: false,
        error: null,
        expiresAt: session.expiresAt || null,
      });
    } catch (error: any) {
      set({
        isAuthenticated: false,
        isLoading: false,
        error: error?.response?.data?.error || error?.message || "Erro ao entrar no app admin",
      });
      throw error;
    }
  },

  logout: async () => {
    await adminApiClient.clearToken();
    set({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      expiresAt: null,
    });
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await adminApiClient.getToken();
      if (!token) {
        set({
          isAuthenticated: false,
          isLoading: false,
          error: null,
          expiresAt: null,
        });
        return;
      }

      const session = await adminApiClient.me();
      set({
        isAuthenticated: Boolean(session.authenticated),
        isLoading: false,
        error: null,
        expiresAt: session.expiresAt || null,
      });
    } catch {
      await adminApiClient.clearToken();
      set({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        expiresAt: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
