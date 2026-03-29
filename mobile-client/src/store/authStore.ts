import { create } from "zustand";
import { clearMobileAccessToken, setMobileAccessToken } from "../lib/api";

export type MobileCustomerUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  createdAt?: string | null;
};

export type MobileCustomerProfile = {
  userId: string;
  experienceMode: "standard" | "senior";
  preferredLanguage: "pt" | "en" | "es";
  preferredAirport?: string | null;
  needsHumanHelp: boolean;
  biometricEnabled: boolean;
  scannerHandoffEnabled: boolean;
  seniorAssistantEnabled: boolean;
};

export type MobileCustomerDevice = {
  id: string;
  platform: "ios" | "android" | "web";
  storeChannel: "app_store" | "play_store" | "galaxy_store" | "internal" | "direct";
  appVariant: "standard" | "senior";
  deviceName?: string | null;
  deviceModel?: string | null;
  osVersion?: string | null;
  appVersion?: string | null;
  biometricReady?: boolean;
  biometricKeyAlias?: string | null;
  biometricRegisteredAt?: string | null;
  biometricLastValidatedAt?: string | null;
};

export type MobileCustomerSession = {
  accessToken: string;
  expiresInSeconds: number;
  refreshExpiresAt: string;
  refreshCookieIssued?: boolean;
};

type AuthPayload = {
  user: MobileCustomerUser;
  profile: MobileCustomerProfile;
  device: MobileCustomerDevice;
  session: MobileCustomerSession;
};

type AuthState = {
  user?: MobileCustomerUser;
  profile?: MobileCustomerProfile;
  device?: MobileCustomerDevice;
  session?: MobileCustomerSession;
  setAuthenticated: (payload: AuthPayload) => void;
  updateProfile: (profile: MobileCustomerProfile) => void;
  updateDevice: (device: MobileCustomerDevice) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  profile: undefined,
  device: undefined,
  session: undefined,
  setAuthenticated: ({ user, profile, device, session }) => {
    setMobileAccessToken(session.accessToken);
    set({ user, profile, device, session });
  },
  updateProfile: (profile) => set({ profile }),
  updateDevice: (device) => set({ device }),
  clearAuth: () => {
    clearMobileAccessToken();
    set({
      user: undefined,
      profile: undefined,
      device: undefined,
      session: undefined,
    });
  },
}));
