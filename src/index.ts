/**
 * Cloudflare Worker fronting the michelstravel1 container (migration Fase 1).
 *
 * Architecture: Worker -> Durable Object (MichelsTravelContainer) ->
 * Cloudflare Container running the repo's Dockerfile (Express on port 5000).
 * The app itself is untouched; this file is only the Cloudflare layer.
 *
 * Secrets: the 18 Worker secrets (set in Fase 2, never in code) are passed
 * to the container BY NAME ONLY through `envVars` below. No secret value
 * appears in this file, in the repo, or in any commit.
 *
 * Test address only: no custom domain / routes are attached yet (Fase 4).
 * Deploy target for now is the *.workers.dev URL.
 */
import { Container, getContainer } from "@cloudflare/containers";

export interface Env {
  /** Durable Object binding for the container (one shared instance). */
  MICHELS_TRAVEL_CONTAINER: DurableObjectNamespace<MichelsTravelContainer>;
  // Plain vars from wrangler.jsonc — literal types match what
  // `wrangler types` generates in worker-configuration.d.ts.
  NODE_ENV: "production";
  PORT: "5000";
  // Worker secrets (Fase 2) — names only; values live in Cloudflare.
  ADMIN_PASSWORD: string;
  AI_INTEGRATIONS_OPENAI_API_KEY: string;
  AI_INTEGRATIONS_OPENAI_BASE_URL: string;
  DATABASE_URL: string;
  DUFFEL_API_TOKEN: string;
  DUFFEL_LIVE_TOKEN: string;
  DUFFEL_WEBHOOK_SECRET: string;
  GEOAPIFY_API_KEY: string;
  OWNER_PUSH_PRIVATE_KEY: string;
  OWNER_PUSH_PUBLIC_KEY: string;
  OWNER_PUSH_SUBJECT: string;
  PUBLIC_PREFIX: string;
  SECRET_API: string;
  SESSION_SECRET: string;
  STRIPE_LIVE_PUBLISHABLE_KEY: string;
  STRIPE_LIVE_SECRET_KEY: string;
  STRIPE_TEST_PUBLISHABLE_KEY: string;
  STRIPE_TEST_SECRET_KEY: string;
}

export class MichelsTravelContainer extends Container<Env> {
  /** Express listens on 5000 inside the container (Dockerfile EXPOSE 5000). */
  defaultPort = 5000;
  /** Shut the container down after 10 minutes without activity. */
  sleepAfter = "10m";

  /**
   * Environment passed to the container at start. `this.env` is available
   * here: the DurableObject base constructor assigns it before subclass
   * field initializers run. Secrets are referenced by name only.
   * Typed as Record<string, string> so the Durable Object stub stays
   * assignable to the base Container type (see getContainer call below).
   */
  envVars: Record<string, string> = {
    NODE_ENV: "production",
    PORT: "5000",
    ADMIN_PASSWORD: this.env.ADMIN_PASSWORD,
    AI_INTEGRATIONS_OPENAI_API_KEY: this.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    AI_INTEGRATIONS_OPENAI_BASE_URL: this.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    DATABASE_URL: this.env.DATABASE_URL,
    DUFFEL_API_TOKEN: this.env.DUFFEL_API_TOKEN,
    DUFFEL_LIVE_TOKEN: this.env.DUFFEL_LIVE_TOKEN,
    DUFFEL_WEBHOOK_SECRET: this.env.DUFFEL_WEBHOOK_SECRET,
    GEOAPIFY_API_KEY: this.env.GEOAPIFY_API_KEY,
    OWNER_PUSH_PRIVATE_KEY: this.env.OWNER_PUSH_PRIVATE_KEY,
    OWNER_PUSH_PUBLIC_KEY: this.env.OWNER_PUSH_PUBLIC_KEY,
    OWNER_PUSH_SUBJECT: this.env.OWNER_PUSH_SUBJECT,
    PUBLIC_PREFIX: this.env.PUBLIC_PREFIX,
    SECRET_API: this.env.SECRET_API,
    SESSION_SECRET: this.env.SESSION_SECRET,
    STRIPE_LIVE_PUBLISHABLE_KEY: this.env.STRIPE_LIVE_PUBLISHABLE_KEY,
    STRIPE_LIVE_SECRET_KEY: this.env.STRIPE_LIVE_SECRET_KEY,
    STRIPE_TEST_PUBLISHABLE_KEY: this.env.STRIPE_TEST_PUBLISHABLE_KEY,
    STRIPE_TEST_SECRET_KEY: this.env.STRIPE_TEST_SECRET_KEY,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // One shared container instance serves the whole app (single Express
    // server, in-memory notification loop). `stub.fetch` forwards the
    // request as-is, including WebSocket upgrades (voice assistant).
    const container = getContainer(env.MICHELS_TRAVEL_CONTAINER);
    return container.fetch(request);
  },
};
