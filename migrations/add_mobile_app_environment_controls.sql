-- Add environment-specific controls for the consumer mobile app.
-- This keeps the mobile app on the same shared API while allowing
-- activation/deactivation per environment from the admin dashboard.

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS mobile_app_test_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS mobile_app_production_enabled BOOLEAN NOT NULL DEFAULT TRUE;
