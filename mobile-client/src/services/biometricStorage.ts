import AsyncStorage from "@react-native-async-storage/async-storage";

const BIOMETRIC_ENROLLMENT_KEY = "michels.biometric.enrollment";

export type StoredBiometricEnrollment = {
  userId: string;
  deviceId: string;
  email: string;
  firstName?: string | null;
  keyAlias: string;
  enabled: boolean;
};

export async function saveBiometricEnrollment(enrollment: StoredBiometricEnrollment) {
  await AsyncStorage.setItem(BIOMETRIC_ENROLLMENT_KEY, JSON.stringify(enrollment));
}

export async function getBiometricEnrollment() {
  const rawValue = await AsyncStorage.getItem(BIOMETRIC_ENROLLMENT_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredBiometricEnrollment;
  } catch {
    await AsyncStorage.removeItem(BIOMETRIC_ENROLLMENT_KEY);
    return null;
  }
}

export async function clearBiometricEnrollment() {
  await AsyncStorage.removeItem(BIOMETRIC_ENROLLMENT_KEY);
}
