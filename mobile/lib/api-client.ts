import axios, { AxiosError, AxiosHeaders, AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { AuthMethod, AuthTokens, CustomerAuthPayload, CustomerIdentityPayload } from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://www.michelstravel.agency';

type LoginInput = {
  method: AuthMethod;
  identifier: string;
  password: string;
};

type RegisterInput = LoginInput & {
  firstName: string;
  lastName?: string;
};

type WebSessionResponse = {
  url: string;
  expiresInSeconds: number;
};

class ApiClient {
  private client: AxiosInstance;
  private refreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosError['config'] & { _retry?: boolean };
        const requestUrl = originalRequest?.url || '';
        const isAuthRoute = requestUrl.includes('/api/mobile/customer/auth/login')
          || requestUrl.includes('/api/mobile/customer/auth/register')
          || requestUrl.includes('/api/mobile/customer/auth/refresh');

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
          if (this.refreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                const headers = AxiosHeaders.from(originalRequest.headers);
                headers.set('Authorization', `Bearer ${token}`);
                originalRequest.headers = headers;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.refreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.refreshing = false;
            this.onRefreshed(newToken);
            this.refreshSubscribers = [];

            const headers = AxiosHeaders.from(originalRequest.headers);
            headers.set('Authorization', `Bearer ${newToken}`);
            originalRequest.headers = headers;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.refreshing = false;
            this.refreshSubscribers = [];
            await this.clearTokens();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync('accessToken');
  }

  private async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync('refreshToken');
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
  }

  private async storeSession(session: AuthTokens) {
    await SecureStore.setItemAsync('accessToken', session.accessToken);
    await SecureStore.setItemAsync('refreshToken', session.refreshToken);
    await SecureStore.setItemAsync('refreshExpiresAt', session.refreshExpiresAt);
  }

  private buildDevicePayload() {
    const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
    return {
      platform,
      storeChannel: 'direct' as const,
      appVariant: 'senior' as const,
      deviceName: Constants.expoConfig?.name || 'Michels Travel Senior',
      osVersion: String(Platform.Version ?? ''),
      appVersion: Constants.expoConfig?.version || '1.0.0',
    };
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post<CustomerAuthPayload>(`${API_BASE_URL}/api/mobile/customer/auth/refresh`, {
      refreshToken,
    });

    await this.storeSession(response.data.session);
    return response.data.session.accessToken;
  }

  async clearTokens() {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('refreshExpiresAt');
  }

  async login(input: LoginInput): Promise<CustomerAuthPayload> {
    const response = await this.client.post<CustomerAuthPayload>('/api/mobile/customer/auth/login', {
      ...input,
      device: this.buildDevicePayload(),
    });

    await this.storeSession(response.data.session);
    return response.data;
  }

  async register(input: RegisterInput): Promise<CustomerAuthPayload> {
    const response = await this.client.post<CustomerAuthPayload>('/api/mobile/customer/auth/register', {
      ...input,
      device: this.buildDevicePayload(),
    });

    await this.storeSession(response.data.session);
    return response.data;
  }

  async getCurrentCustomer(): Promise<CustomerIdentityPayload> {
    const response = await this.client.get<CustomerIdentityPayload>('/api/mobile/customer/me');
    return response.data;
  }

  async createWebSessionLink(target: string): Promise<string> {
    const response = await this.client.post<WebSessionResponse>('/api/mobile/customer/web-session', {
      target,
    });
    return response.data.url;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/api/mobile/customer/auth/logout');
    } finally {
      await this.clearTokens();
    }
  }
}

export const apiClient = new ApiClient();
