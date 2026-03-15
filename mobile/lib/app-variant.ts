import Constants from "expo-constants";

export type AppVariant = "senior" | "admin";

type ExtraConfig = {
  appVariant?: AppVariant;
  appDisplayName?: string;
  appScheme?: string;
};

function readExpoExtra(): ExtraConfig {
  const expoConfig = Constants.expoConfig;
  const extra = (expoConfig?.extra || {}) as ExtraConfig;
  return extra;
}

const extraConfig = readExpoExtra();

export const APP_VARIANT: AppVariant =
  extraConfig.appVariant === "admin" ? "admin" : "senior";

export const IS_ADMIN_APP = APP_VARIANT === "admin";
export const IS_SENIOR_APP = APP_VARIANT === "senior";

export const APP_DISPLAY_NAME =
  extraConfig.appDisplayName ||
  (IS_ADMIN_APP ? "Michels Travel Admin" : "Michels Travel Senior");

export const APP_SCHEME =
  extraConfig.appScheme ||
  (IS_ADMIN_APP ? "michelstraveladmin" : "michelstravelsenior");
