
import Stripe from 'stripe';

let connectionSettings: any;

function isValidStripeKey(key: string, type: 'secret' | 'publishable'): boolean {
  if (!key || typeof key !== 'string') return false;
  if (type === 'secret') {
    return key.startsWith('sk_live_') || key.startsWith('sk_test_');
  }
  return key.startsWith('pk_live_') || key.startsWith('pk_test_');
}

async function getAppTestMode(): Promise<boolean> {
  try {
    const { db } = await import('./db');
    const { siteSettings } = await import('@shared/schema');
    const [settings] = await db.select().from(siteSettings).limit(1);
    return settings?.testMode ?? true;
  } catch {
    return true;
  }
}

async function getCredentials() {
  const appTestMode = await getAppTestMode();

  if (appTestMode) {
    const testSecret = process.env.STRIPE_TEST_SECRET_KEY;
    const testPub = process.env.STRIPE_TEST_PUBLISHABLE_KEY;

    if (testSecret && testPub && isValidStripeKey(testSecret, 'secret') && isValidStripeKey(testPub, 'publishable')) {
      console.log(`[Stripe] TEST MODE - Using test keys (sk_test_/pk_test_)`);
      return {
        publishableKey: testPub,
        secretKey: testSecret,
      };
    }

    console.warn('[Stripe] TEST MODE - No valid test keys found (STRIPE_TEST_SECRET_KEY / STRIPE_TEST_PUBLISHABLE_KEY)');
  } else {
    const liveSecret = process.env.STRIPE_LIVE_SECRET_KEY;
    const livePub = process.env.STRIPE_LIVE_PUBLISHABLE_KEY;

    if (liveSecret && livePub && isValidStripeKey(liveSecret, 'secret') && isValidStripeKey(livePub, 'publishable')) {
      console.log(`[Stripe] LIVE MODE - Using live keys (sk_live_/pk_live_)`);
      return {
        publishableKey: livePub,
        secretKey: liveSecret,
      };
    }

    console.warn('[Stripe] LIVE MODE - No valid live keys found (STRIPE_LIVE_SECRET_KEY / STRIPE_LIVE_PUBLISHABLE_KEY)');
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (xReplitToken && hostname) {
    try {
      const isDeployment = process.env.REPLIT_DEPLOYMENT === '1';
      const connectorName = 'stripe';
      const targetEnvironment = isDeployment ? 'production' : 'development';

      const url = new URL(`https://${hostname}/api/v2/connection`);
      url.searchParams.set('include_secrets', 'true');
      url.searchParams.set('connector_names', connectorName);
      url.searchParams.set('environment', targetEnvironment);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      });

      const data = await response.json();
      connectionSettings = data.items?.[0];

      if (connectionSettings?.settings?.publishable && connectionSettings?.settings?.secret) {
        console.log(`[Stripe] Falling back to connector keys (testMode=${appTestMode})`);
        return {
          publishableKey: connectionSettings.settings.publishable,
          secretKey: connectionSettings.settings.secret,
        };
      }
    } catch (err) {
      console.warn('[Stripe] Failed to fetch connector credentials:', (err as Error).message);
    }
  }

  throw new Error(
    appTestMode
      ? 'No Stripe test credentials found. Set STRIPE_TEST_SECRET_KEY and STRIPE_TEST_PUBLISHABLE_KEY.'
      : 'No Stripe live credentials found. Set STRIPE_LIVE_SECRET_KEY and STRIPE_LIVE_PUBLISHABLE_KEY.'
  );
}

export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();

  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia' as any,
  });
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();

  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}

let stripeSync: any = null;
let stripeSyncTestMode: boolean | null = null;

export async function getStripeSync() {
  const currentTestMode = await getAppTestMode();

  if (stripeSync && stripeSyncTestMode === currentTestMode) {
    return stripeSync;
  }

  const { StripeSync } = await import('stripe-replit-sync');
  const secretKey = await getStripeSecretKey();

  stripeSync = new StripeSync({
    poolConfig: {
      connectionString: process.env.DATABASE_URL!,
      max: 2,
    },
    stripeSecretKey: secretKey,
  });
  stripeSyncTestMode = currentTestMode;

  return stripeSync;
}
