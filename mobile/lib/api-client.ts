import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { AuthTokens, ApiResponse } from '@/types';

// URL do backend - usa túnel público do Manus em produção
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://3000-ibhc3kubcbhrdoemug2dy-ba174052.us1.manus.computer';

class ApiClient {
  private client: AxiosInstance;
  private refreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token em todas as requisições
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para refresh automático de token
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.refreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
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
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.refreshing = false;
            await this.clearTokens();
            // Redirecionar para login seria feito aqui
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
  }

  private async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('accessToken');
  }

  private async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('refreshToken');
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_BASE_URL}/api/mobile/auth/refresh`, {
      refreshToken,
    });

    const { accessToken, expiresAt } = response.data;
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('tokenExpiresAt', expiresAt.toString());

    return accessToken;
  }

  private async clearTokens() {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('tokenExpiresAt');
  }

  // Métodos de autenticação
  async login(email: string, password: string): Promise<AuthTokens> {
    const response = await this.client.post<ApiResponse<AuthTokens>>(
      '/api/mobile/auth/login',
      { email, password }
    );

    if (response.data.success && response.data.data) {
      const tokens = response.data.data;
      await SecureStore.setItemAsync('accessToken', tokens.accessToken);
      await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
      await SecureStore.setItemAsync('tokenExpiresAt', tokens.expiresAt.toString());
      return tokens;
    }

    throw new Error(response.data.error || 'Login failed');
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/api/mobile/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearTokens();
    }
  }

  // Métodos de Dashboard
  async getDashboardStats() {
    const response = await this.client.get('/api/mobile/dashboard/stats');
    return response.data;
  }

  async getRecentActivity() {
    const response = await this.client.get('/api/mobile/dashboard/recent-activity');
    return response.data;
  }

  // Métodos de Reservas
  async getBookings(page: number = 1, filters?: any) {
    const response = await this.client.get('/api/mobile/bookings', {
      params: { page, ...filters },
    });
    return response.data;
  }

  async getBookingById(id: string) {
    const response = await this.client.get(`/api/mobile/bookings/${id}`);
    return response.data;
  }

  async createBooking(data: any) {
    const response = await this.client.post('/api/mobile/bookings', data);
    return response.data;
  }

  async updateBooking(id: string, data: any) {
    const response = await this.client.put(`/api/mobile/bookings/${id}`, data);
    return response.data;
  }

  async cancelBooking(id: string) {
    const response = await this.client.delete(`/api/mobile/bookings/${id}`);
    return response.data;
  }

  // Métodos de Voos
  async searchFlights(params: any) {
    const response = await this.client.get('/api/mobile/flights/search', { params });
    return response.data;
  }

  async getFlightById(id: string) {
    const response = await this.client.get(`/api/mobile/flights/${id}`);
    return response.data;
  }

  // Métodos de Pagamentos
  async getPayments(page: number = 1, filters?: any) {
    const response = await this.client.get('/api/mobile/payments', {
      params: { page, ...filters },
    });
    return response.data;
  }

  async getPaymentById(id: string) {
    const response = await this.client.get(`/api/mobile/payments/${id}`);
    return response.data;
  }

  async processRefund(paymentId: string, amount?: number) {
    const response = await this.client.post('/api/mobile/payments/refund', {
      paymentId,
      amount,
    });
    return response.data;
  }

  // Métodos de Mensagens
  async getConversations(page: number = 1) {
    const response = await this.client.get('/api/mobile/messages', { params: { page } });
    return response.data;
  }

  async getMessages(conversationId: string, page: number = 1) {
    const response = await this.client.get(`/api/mobile/messages/${conversationId}`, {
      params: { page },
    });
    return response.data;
  }

  async sendMessage(conversationId: string, content: string) {
    const response = await this.client.post('/api/mobile/messages', {
      conversationId,
      content,
    });
    return response.data;
  }

  // Métodos de Notificações
  async registerPushToken(token: string) {
    const response = await this.client.post('/api/mobile/notifications/register', {
      token,
      platform: 'android',
    });
    return response.data;
  }

  async getNotifications(page: number = 1) {
    const response = await this.client.get('/api/mobile/notifications', {
      params: { page },
    });
    return response.data;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.client.put(`/api/mobile/notifications/${id}/read`);
    return response.data;
  }

  // Métodos de Analytics
  async getAnalytics(period: string) {
    const response = await this.client.get('/api/mobile/analytics', {
      params: { period },
    });
    return response.data;
  }

  async getRevenueData(period: string) {
    const response = await this.client.get('/api/mobile/analytics/revenue', {
      params: { period },
    });
    return response.data;
  }

  async getBookingsData(period: string) {
    const response = await this.client.get('/api/mobile/analytics/bookings', {
      params: { period },
    });
    return response.data;
  }

  async getCommissionsData(period: string) {
    const response = await this.client.get('/api/mobile/analytics/commissions', {
      params: { period },
    });
    return response.data;
  }

  // Métodos de Escalações
  async getEscalations(page: number = 1, filters?: any) {
    const response = await this.client.get('/api/mobile/escalations', {
      params: { page, ...filters },
    });
    return response.data;
  }

  async getEscalationById(id: string) {
    const response = await this.client.get(`/api/mobile/escalations/${id}`);
    return response.data;
  }

  async resolveEscalation(id: string, notes?: string) {
    const response = await this.client.put(`/api/mobile/escalations/${id}/resolve`, {
      notes,
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
