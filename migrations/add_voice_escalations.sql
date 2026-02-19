-- Migration: Add voice_escalations table for AI phone assistant
-- Created: 2026-02-18

CREATE TABLE IF NOT EXISTS voice_escalations (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('voice', 'chat')),
  reason TEXT NOT NULL,
  customer_phone TEXT,
  summary TEXT,
  call_sid TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_voice_escalations_status ON voice_escalations(status);
CREATE INDEX IF NOT EXISTS idx_voice_escalations_created_at ON voice_escalations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_escalations_customer_phone ON voice_escalations(customer_phone);
