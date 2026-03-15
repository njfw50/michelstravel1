import axios, { AxiosError, AxiosHeaders, AxiosInstance } from "axios";
import * as SecureStore from "expo-secure-store";

import type { AdminAuthResponse, AdminSessionInfo, OwnerDeskData } from "@/types/admin";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://www.michelstravel.agency";
const ADMIN_TOKEN_KEY = "adminAccessToken";

class AdminApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use(async (config) => {
      const token = await this.getToken();
      if (token) {
        const headers = AxiosHeaders.from(config.headers);
        headers.set("Authorization", `Bearer ${token}`);
        config.headers = headers;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await this.clearToken();
        }
        return Promise.reject(error);
      },
    );
  }

  async login(password: string) {
    const response = await this.client.post<AdminAuthResponse>("/api/admin-app/login", { password });
    await this.setToken(response.data.token);
    return response.data;
  }

  async me() {
    const response = await this.client.get<AdminSessionInfo>("/api/admin-app/me");
    return response.data;
  }

  async getOwnerDesk() {
    const response = await this.client.get<OwnerDeskData>("/api/admin/owner-desk");
    return response.data;
  }

  async getToken() {
    return SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
  }

  async setToken(token: string) {
    await SecureStore.setItemAsync(ADMIN_TOKEN_KEY, token);
  }

  async clearToken() {
    await SecureStore.deleteItemAsync(ADMIN_TOKEN_KEY);
  }
}

export const adminApiClient = new AdminApiClient();
