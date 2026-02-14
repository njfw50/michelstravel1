
import Stripe from 'stripe';

let connectionSettings: any;

function isValidStripeKey(key: string | undefined | null, type: 'secret' | 'publishable'): boolean {
  if (!key || typeof key !== 'string') return false;
  if (type === 'secret') {
    return key.startsWith('sk_live_') || key.startsWith('sk_test_') || key.startsWith('rk_live_') || key.startsWith('rk_test_');
  }
  return key.startsWith('pk_live_') || key.startsWith('pk_test_');
}

function isTestKey(key: string): boolean {
  return key.includes('_test_');
}

function isLiveKey(key: string): boolean {
  return key.includes('_live_');
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

interface StripeCredentials {
  publishableKey: string;
  secretKey: string;
  source: string;
}

async function fetchConnectorCredentials(): Promise<StripeCredentials | null> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken || !hostname) return null;

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
      return {
        publishableKey: connectionSettings.settings.publishable,
        secretKey: connectionSettings.settings.secret,
        source: `connector (${targetEnvironment})`,
      };
    }
  } catch (err) {
    console.warn('[Stripe] Failed to fetch connector credentials:', (err as Error).message);
  }
  return null;
}

async function getCredentials() {
  const appTestMode = await getAppTestMode();
  const wantTest = appTestMode;

  const allSources: StripeCredentials[] = [];

  const testSecret = process.env.STRIPE_TEST_SECRET_KEY;
  const testPub = process.env.STRIPE_TEST_PUBLISHABLE_KEY;
  if (isValidStripeKey(testSecret, 'secret') && isValidStripeKey(testPub, 'publishable') &&
      isTestKey(testSecret!) && isTestKey(testPub!)) {
    allSources.push({ publishableKey: testPub!, secretKey: testSecret!, source: 'env (test)' });
  }

  const liveSecret = process.env.STRIPE_LIVE_SECRET_KEY;
  const livePub = process.env.STRIPE_LIVE_PUBLISHABLE_KEY;
  if (isValidStripeKey(liveSecret, 'secret') && isValidStripeKey(livePub, 'publishable') &&
      isLiveKey(liveSecret!) && isLiveKey(livePub!)) {
    allSources.push({ publishableKey: livePub!, secretKey: liveSecret!, source: 'env (live)' });
  }

  const connectorCreds = await fetchConnectorCredentials();
  if (connectorCreds) {
    allSources.push(connectorCreds);
  }

  const matchingSource = allSources.find(s => {
    if (wantTest) return isTestKey(s.secretKey);
    return isLiveKey(s.secretKey);
  });

  if (matchingSource) {
    console.log(`[Stripe] ${wantTest ? 'TEST' : 'LIVE'} MODE - Using ${matchingSource.source} keys`);
    return matchingSource;
  }

  if (allSources.length > 0) {
    const fallback = allSources[0];
    const fallbackIsTest = isTestKey(fallback.secretKey);
    console.warn(`[Stripe] WARNING: App wants ${wantTest ? 'TEST' : 'LIVE'} mode but only ${fallbackIsTest ? 'test' : 'live'} keys available from ${fallback.source}. Using those as fallback.`);
    return fallback;
  }

  throw new Error(
    `No Stripe credentials found. Set STRIPE_TEST_SECRET_KEY/STRIPE_TEST_PUBLISHABLE_KEY for test mode or STRIPE_LIVE_SECRET_KEY/STRIPE_LIVE_PUBLISHABLE_KEY for live mode.`
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

export async function validateStripeKeysForMode(targetTestMode: boolean): Promise<{ valid: boolean; error?: string }> {
  const wantTest = targetTestMode;

  const allSources: StripeCredentials[] = [];

  const testSecret = process.env.STRIPE_TEST_SECRET_KEY;
  const testPub = process.env.STRIPE_TEST_PUBLISHABLE_KEY;
  if (isValidStripeKey(testSecret, 'secret') && isValidStripeKey(testPub, 'publishable') &&
      isTestKey(testSecret!) && isTestKey(testPub!)) {
    allSources.push({ publishableKey: testPub!, secretKey: testSecret!, source: 'env (test)' });
  }

  const liveSecret = process.env.STRIPE_LIVE_SECRET_KEY;
  const livePub = process.env.STRIPE_LIVE_PUBLISHABLE_KEY;
  if (isValidStripeKey(liveSecret, 'secret') && isValidStripeKey(livePub, 'publishable') &&
      isLiveKey(liveSecret!) && isLiveKey(livePub!)) {
    allSources.push({ publishableKey: livePub!, secretKey: liveSecret!, source: 'env (live)' });
  }

  const connectorCreds = await fetchConnectorCredentials();
  if (connectorCreds) {
    allSources.push(connectorCreds);
  }

  const hasMatch = allSources.some(s => {
    if (wantTest) return isTestKey(s.secretKey);
    return isLiveKey(s.secretKey);
  });

  if (hasMatch) return { valid: true };

  if (allSources.length > 0) {
    return { valid: true };
  }

  return {
    valid: false,
    error: `No Stripe keys found for ${wantTest ? 'test' : 'live'} mode. Configure your Stripe keys in secrets.`
  };
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
