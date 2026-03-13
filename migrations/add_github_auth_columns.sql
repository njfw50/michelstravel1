-- Migration: Add GitHub OAuth columns to users
-- Created: 2026-03-12

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS github_id VARCHAR,
  ADD COLUMN IF NOT EXISTS github_username VARCHAR;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_github_id_unique
  ON users(github_id)
  WHERE github_id IS NOT NULL;
