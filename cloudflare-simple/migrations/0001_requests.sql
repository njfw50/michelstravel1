CREATE TABLE IF NOT EXISTS reservation_requests (
 id TEXT PRIMARY KEY,
 access_hash TEXT NOT NULL,
 created_at TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'received' CHECK(status IN ('received','contacted','closed')),
 mode TEXT NOT NULL,
 name TEXT NOT NULL,
 email TEXT NOT NULL,
 phone TEXT NOT NULL,
 offer_id TEXT NOT NULL,
 offer_json TEXT NOT NULL,
 consent_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS requests_created ON reservation_requests(created_at);
