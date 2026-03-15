CREATE TABLE IF NOT EXISTS owner_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL DEFAULT 'owner_desk',
  endpoint TEXT NOT NULL UNIQUE,
  subscription JSONB NOT NULL DEFAULT '{}'::jsonb,
  device_label TEXT,
  platform TEXT,
  user_agent TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMP,
  last_notified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owner_push_subscriptions_channel
  ON owner_push_subscriptions (channel);

CREATE INDEX IF NOT EXISTS idx_owner_push_subscriptions_active
  ON owner_push_subscriptions (active);

CREATE TABLE IF NOT EXISTS owner_push_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES owner_push_subscriptions(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'alert',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owner_push_deliveries_subscription_id
  ON owner_push_deliveries (subscription_id);

CREATE INDEX IF NOT EXISTS idx_owner_push_deliveries_fingerprint
  ON owner_push_deliveries (fingerprint);

CREATE INDEX IF NOT EXISTS idx_owner_push_deliveries_delivered_at
  ON owner_push_deliveries (delivered_at);
