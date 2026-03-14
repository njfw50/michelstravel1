-- Consumer mobile platform tables for the main PostgreSQL backend.
-- This migration is for customer-facing standard/senior apps.
-- It is intentionally separate from the existing admin mobile schema under /mobile.

CREATE TABLE IF NOT EXISTS customer_profiles (
  user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  experience_mode text NOT NULL DEFAULT 'standard' CHECK (experience_mode IN ('standard', 'senior')),
  preferred_language text NOT NULL DEFAULT 'pt',
  preferred_airport text,
  saved_passengers jsonb NOT NULL DEFAULT '[]'::jsonb,
  connection_tolerance text NOT NULL DEFAULT 'balanced' CHECK (connection_tolerance IN ('avoid', 'one_stop', 'balanced', 'price_first')),
  bags_preference text NOT NULL DEFAULT 'flexible' CHECK (bags_preference IN ('checked', 'carry', 'flexible')),
  needs_human_help boolean NOT NULL DEFAULT false,
  biometric_enabled boolean NOT NULL DEFAULT false,
  scanner_handoff_enabled boolean NOT NULL DEFAULT true,
  senior_assistant_enabled boolean NOT NULL DEFAULT false,
  last_active_booking_id integer REFERENCES bookings(id) ON DELETE SET NULL,
  last_active_offer_id text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_mobile_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  store_channel text NOT NULL DEFAULT 'direct' CHECK (store_channel IN ('app_store', 'play_store', 'galaxy_store', 'internal', 'direct')),
  app_variant text NOT NULL DEFAULT 'standard' CHECK (app_variant IN ('standard', 'senior')),
  device_name text,
  device_model text,
  os_version text,
  app_version text,
  push_token text,
  trusted_at timestamp,
  last_seen_at timestamp,
  revoked_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_mobile_devices_user_id
  ON customer_mobile_devices(user_id);

CREATE INDEX IF NOT EXISTS idx_customer_mobile_devices_active
  ON customer_mobile_devices(user_id, app_variant, platform)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS customer_mobile_refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES customer_mobile_devices(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamp NOT NULL,
  last_used_at timestamp,
  revoked_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_mobile_refresh_tokens_user_id
  ON customer_mobile_refresh_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_customer_mobile_refresh_tokens_device_id
  ON customer_mobile_refresh_tokens(device_id);

CREATE TABLE IF NOT EXISTS document_scan_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar REFERENCES users(id) ON DELETE CASCADE,
  device_id uuid REFERENCES customer_mobile_devices(id) ON DELETE SET NULL,
  booking_id integer REFERENCES bookings(id) ON DELETE CASCADE,
  passenger_index integer NOT NULL DEFAULT 0,
  source_channel text NOT NULL DEFAULT 'web' CHECK (source_channel IN ('web', 'mobile')),
  target_channel text NOT NULL DEFAULT 'mobile' CHECK (target_channel IN ('web', 'mobile')),
  app_variant text NOT NULL DEFAULT 'standard' CHECK (app_variant IN ('standard', 'senior')),
  pairing_code varchar(12) NOT NULL UNIQUE,
  deep_link_token varchar(128) NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending_pair' CHECK (status IN ('pending_pair', 'paired', 'capturing', 'uploaded', 'confirmed', 'expired', 'cancelled')),
  context_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamp NOT NULL,
  paired_at timestamp,
  confirmed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_scan_sessions_booking_id
  ON document_scan_sessions(booking_id);

CREATE INDEX IF NOT EXISTS idx_document_scan_sessions_user_id
  ON document_scan_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_document_scan_sessions_active
  ON document_scan_sessions(status, expires_at);

CREATE TABLE IF NOT EXISTS document_scan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_session_id uuid NOT NULL REFERENCES document_scan_sessions(id) ON DELETE CASCADE,
  image_front_url text,
  image_back_url text,
  cropped_mrz_url text,
  ocr_engine text NOT NULL DEFAULT 'web_fallback',
  mrz_text text,
  parsed_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence integer,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'confirmed', 'rejected')),
  reviewer_mode text NOT NULL DEFAULT 'customer' CHECK (reviewer_mode IN ('customer', 'agent')),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_scan_results_session_id
  ON document_scan_results(scan_session_id);
