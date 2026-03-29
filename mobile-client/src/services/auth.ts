import { Platform } from "react-native";
import { api } from "../lib/api";
import {
  MobileCustomerDevice,
  MobileCustomerProfile,
  MobileCustomerSession,
  MobileCustomerUser,
} from "../store/authStore";

type AppVariant = "standard" | "senior";

type MobileAuthResponse = {
  user: MobileCustomerUser;
  profile: MobileCustomerProfile;
  device: MobileCustomerDevice;
  session: MobileCustomerSession;
};

type BiometricChallengeResponse = {
  challengeId: string;
  challenge: string;
  expiresInSeconds: number;
};

type BiometricRegistrationResponse = {
  device: MobileCustomerDevice;
  profile: MobileCustomerProfile;
};

type LoginPayload = {
  email: string;
  password: string;
  appVariant?: AppVariant;
};

type RegisterPayload = {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  appVariant?: AppVariant;
};

function buildDevicePayload(appVariant: AppVariant = "standard") {
  const platformConstants = Platform.constants as { Model?: string } | undefined;

  return {
    platform: Platform.OS === "ios" ? "ios" : "android",
    storeChannel: "direct" as const,
    appVariant,
    deviceModel: platformConstants?.Model ?? undefined,
    osVersion: String(Platform.Version ?? ""),
    appVersion: "0.1.0",
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function extractErrorMessage(error: unknown) {
  const fallback = "Não foi possível concluir a autenticação agora.";

  if (typeof error !== "object" || !error) {
    return fallback;
  }

  const maybeResponse = error as { response?: { data?: { error?: string; message?: string } } };
  return maybeResponse.response?.data?.error || maybeResponse.response?.data?.message || fallback;
}

export async function loginCustomerAccount({ email, password, appVariant = "standard" }: LoginPayload) {
  try {
    const response = await api.post<MobileAuthResponse>("/api/mobile/customer/auth/login", {
      method: "email",
      identifier: normalizeEmail(email),
      password,
      device: buildDevicePayload(appVariant),
    });

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function registerCustomerAccount({
  firstName,
  lastName,
  email,
  password,
  appVariant = "standard",
}: RegisterPayload) {
  try {
    const response = await api.post<MobileAuthResponse>("/api/mobile/customer/auth/register", {
      firstName: firstName.trim(),
      lastName: lastName?.trim() || undefined,
      method: "email",
      identifier: normalizeEmail(email),
      password,
      device: buildDevicePayload(appVariant),
    });

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function refreshCustomerSession() {
  try {
    const response = await api.post<MobileAuthResponse>("/api/mobile/customer/auth/refresh", {});
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function registerBiometricKey({
  publicKey,
  keyAlias,
  keyType = "rsa2048",
}: {
  publicKey: string;
  keyAlias: string;
  keyType?: "rsa2048" | "ec256";
}) {
  try {
    const response = await api.post<BiometricRegistrationResponse>("/api/mobile/customer/biometric/register", {
      publicKey,
      keyAlias,
      keyType,
    });

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function revokeBiometricKey() {
  try {
    const response = await api.post<BiometricRegistrationResponse>("/api/mobile/customer/biometric/revoke", {});
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function requestBiometricChallenge(deviceId: string) {
  try {
    const response = await api.post<BiometricChallengeResponse>("/api/mobile/customer/auth/biometric/challenge", {
      deviceId,
    });

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function verifyBiometricLogin({
  challengeId,
  deviceId,
  challenge,
  signature,
}: {
  challengeId: string;
  deviceId: string;
  challenge: string;
  signature: string;
}) {
  try {
    const response = await api.post<MobileAuthResponse>("/api/mobile/customer/auth/biometric/verify", {
      challengeId,
      deviceId,
      challenge,
      signature,
    });

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
