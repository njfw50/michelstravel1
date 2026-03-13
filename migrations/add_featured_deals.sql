-- Migration: Add featured_deals table for public catalog and admin promotions
-- Created: 2026-03-13

CREATE TABLE IF NOT EXISTS featured_deals (
  id SERIAL PRIMARY KEY,
  origin TEXT NOT NULL,
  origin_city TEXT,
  destination TEXT NOT NULL,
  destination_city TEXT,
  departure_date TEXT,
  return_date TEXT,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  airline TEXT,
  cabin_class TEXT DEFAULT 'economy',
  headline TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_featured_deals_active_created
  ON featured_deals(is_active, created_at DESC);
