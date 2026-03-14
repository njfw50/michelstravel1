ALTER TABLE live_sessions
  ADD COLUMN IF NOT EXISTS service_mode TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS entry_point TEXT DEFAULT 'chatbot',
  ADD COLUMN IF NOT EXISTS context_snapshot JSONB;

UPDATE live_sessions
SET
  service_mode = COALESCE(service_mode, 'standard'),
  entry_point = COALESCE(entry_point, 'chatbot')
WHERE service_mode IS NULL OR entry_point IS NULL;
