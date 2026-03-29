ALTER TABLE customer_mobile_devices
  ADD COLUMN IF NOT EXISTS biometric_public_key TEXT,
  ADD COLUMN IF NOT EXISTS biometric_key_alias TEXT,
  ADD COLUMN IF NOT EXISTS biometric_key_type TEXT,
  ADD COLUMN IF NOT EXISTS biometric_registered_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS biometric_last_validated_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS customer_mobile_biometric_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES customer_mobile_devices(id) ON DELETE CASCADE,
  challenge_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL DEFAULT 'login',
  expires_at TIMESTAMP NOT NULL,
  consumed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_mobile_biometric_challenges_user_id
  ON customer_mobile_biometric_challenges(user_id);

CREATE INDEX IF NOT EXISTS idx_customer_mobile_biometric_challenges_device_id
  ON customer_mobile_biometric_challenges(device_id);
