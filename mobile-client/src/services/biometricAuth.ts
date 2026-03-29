import {
  BiometricStrength,
  createKeys,
  deleteKeys,
  isSensorAvailable,
  signWithOptions,
  validateKeyIntegrity,
} from "@sbaiahmed1/react-native-biometrics";

export function buildBiometricKeyAlias(deviceId: string) {
  return `michels_travel_${deviceId.replace(/-/g, "_")}`;
}

export async function ensureBiometricSupport() {
  const sensor = await isSensorAvailable({ biometricStrength: BiometricStrength.Strong });
  if (!sensor.available) {
    throw new Error(sensor.error || "Biometria forte indisponível neste aparelho.");
  }

  return sensor;
}

export async function ensureBiometricKey(alias: string) {
  const integrity = await validateKeyIntegrity(alias);
  if (integrity.keyExists && integrity.valid) {
    return null;
  }

  if (integrity.keyExists && !integrity.valid) {
    await deleteKeys(alias);
  }

  const { publicKey } = await createKeys(alias, "rsa2048", BiometricStrength.Strong, false, false);
  return publicKey;
}

export async function recreateBiometricKey(alias: string) {
  await deleteKeys(alias);
  const { publicKey } = await createKeys(alias, "rsa2048", BiometricStrength.Strong, false, false);
  return publicKey;
}

export async function signBiometricChallenge(alias: string, challenge: string, promptTitle: string, promptSubtitle: string) {
  const result = await signWithOptions({
    keyAlias: alias,
    data: challenge,
    promptTitle,
    promptSubtitle,
    cancelButtonText: "Cancelar",
    disableDeviceFallback: true,
    biometricStrength: BiometricStrength.Strong,
    returnAuthType: true,
  });

  if (!result.success || !result.signature) {
    throw new Error(result.error || "A assinatura biométrica não foi concluída.");
  }

  return result.signature;
}

export async function removeBiometricKey(alias: string) {
  await deleteKeys(alias);
}
