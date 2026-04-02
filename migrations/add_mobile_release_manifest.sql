ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS mobile_consumer_release JSONB,
  ADD COLUMN IF NOT EXISTS mobile_admin_release JSONB;
