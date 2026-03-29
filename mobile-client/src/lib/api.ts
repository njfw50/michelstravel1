import axios from "axios";

const API_BASE = "https://michelstravel.agency";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
  withCredentials: true,
  headers: {
    "x-michels-client": "mobile-consumer",
  },
});

let refreshAccessTokenPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  if (!refreshAccessTokenPromise) {
    refreshAccessTokenPromise = (async () => {
      const [{ refreshCustomerSession }, { useAuthStore }] = await Promise.all([
        import("../services/auth"),
        import("../store/authStore"),
      ]);

      const auth = await refreshCustomerSession();
      useAuthStore.getState().setAuthenticated(auth);
      return auth.session.accessToken;
    })().finally(() => {
      refreshAccessTokenPromise = null;
    });
  }

  return refreshAccessTokenPromise;
}

export function setMobileAccessToken(token: string) {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export function clearMobileAccessToken() {
  delete api.defaults.headers.common.Authorization;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Simple retry on network timeout
    if (error.code === "ECONNABORTED") {
      return api.request(error.config);
    }

    const config = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const requestUrl = String(config?.url || "");

    if (
      error.response?.status === 401 &&
      config &&
      !config._retry &&
      !requestUrl.includes("/api/mobile/customer/auth/login") &&
      !requestUrl.includes("/api/mobile/customer/auth/register") &&
      !requestUrl.includes("/api/mobile/customer/auth/refresh") &&
      !requestUrl.includes("/api/mobile/customer/auth/biometric")
    ) {
      config._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        if (accessToken) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${accessToken}`,
          };
          return api.request(config);
        }
      } catch {
        const { useAuthStore } = await import("../store/authStore");
        useAuthStore.getState().clearAuth();
      }
    }

    return Promise.reject(error);
  },
);
