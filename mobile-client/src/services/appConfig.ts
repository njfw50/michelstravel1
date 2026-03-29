import { api } from "../lib/api";

export type MobileAppConfig = {
  environment: "test" | "production";
  appEnabled: boolean;
  appTestEnabled: boolean;
  appProductionEnabled: boolean;
  sharedResultsApi: boolean;
  sharedCheckoutApi: boolean;
  supportEmail?: string | null;
  supportWhatsApp?: string | null;
};

function isMobileAppConfig(value: unknown): value is MobileAppConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const config = value as Record<string, unknown>;

  return (
    (config.environment === "test" || config.environment === "production") &&
    typeof config.appEnabled === "boolean" &&
    typeof config.appTestEnabled === "boolean" &&
    typeof config.appProductionEnabled === "boolean" &&
    typeof config.sharedResultsApi === "boolean" &&
    typeof config.sharedCheckoutApi === "boolean"
  );
}

export async function getMobileAppConfig() {
  const response = await api.get<MobileAppConfig>("/api/mobile/config", {
    timeout: 10000,
  });

  if (!isMobileAppConfig(response.data)) {
    throw new Error("Invalid mobile app config response");
  }

  return response.data;
}
