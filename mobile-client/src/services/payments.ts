import { api } from "../lib/api";
import { initStripe } from "@stripe/stripe-react-native";

type StripeKeyResponse = {
  publishableKey: string;
};

let cachedStripeKey: string | null = null;

export async function getStripePublishableKey() {
  if (cachedStripeKey) {
    return cachedStripeKey;
  }

  const response = await api.get<StripeKeyResponse>("/api/stripe-key");
  cachedStripeKey = response.data.publishableKey;
  return cachedStripeKey;
}

export async function ensureStripeReady() {
  const publishableKey = await getStripePublishableKey();
  await initStripe({ publishableKey });
  return publishableKey;
}
