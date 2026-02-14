
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

async function getConnectorCredentials(): Promise<{ publishableKey: string; secretKey: string } | null> {
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
      };
    }
  } catch (err) {
    console.warn('[Stripe] Failed to fetch connector credentials:', (err as Error).message);
  }

  return null;
}

async function getCredentials() {
  const isDeployment = process.env.REPLIT_DEPLOYMENT === '1';
  const appTestMode = await getAppTestMode();
  const useLiveKeys = isDeployment || !appTestMode;

  const liveSecretKey = process.env.STRIPE_LIVE_SECRET_KEY;
  const livePubKey = process.env.STRIPE_LIVE_PUBLISHABLE_KEY;
  const hasValidLiveKeys = liveSecretKey && livePubKey 
    && isValidStripeKey(liveSecretKey, 'secret') 
    && isValidStripeKey(livePubKey, 'publishable');

  if (useLiveKeys && hasValidLiveKeys) {
    console.log(`[Stripe] Using live keys (deployment=${isDeployment}, testMode=${appTestMode})`);
    return {
      publishableKey: livePubKey!,
      secretKey: liveSecretKey!,
    };
  }

  if (useLiveKeys && liveSecretKey && !hasValidLiveKeys) {
    console.warn(`[Stripe] Live keys found but invalid format (key starts with '${liveSecretKey.substring(0, 3)}...'). Falling back to connector.`);
  }

  const connectorCreds = await getConnectorCredentials();
  if (connectorCreds) {
    console.log(`[Stripe] Using connector keys (deployment=${isDeployment}, testMode=${appTestMode})`);
    return connectorCreds;
  }

  if (liveSecretKey && livePubKey) {
    console.warn(`[Stripe] Using env var keys as last resort (format may be non-standard)`);
    return {
      publishableKey: livePubKey,
      secretKey: liveSecretKey,
    };
  }

  throw new Error('No valid Stripe credentials found. Set STRIPE_LIVE_SECRET_KEY/STRIPE_LIVE_PUBLISHABLE_KEY with valid sk_live_/pk_live_ keys, or configure the Stripe connector.');
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

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = await getStripeSecretKey();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
