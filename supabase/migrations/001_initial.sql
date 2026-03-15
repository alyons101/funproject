-- Gold prices table: stores hourly XAU/USD spot prices
CREATE TABLE IF NOT EXISTS gold_prices (
  id         BIGSERIAL PRIMARY KEY,
  price_usd  NUMERIC(12, 4) NOT NULL,
  fetched_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Index for time-range queries (last 24 hours chart)
CREATE INDEX IF NOT EXISTS idx_gold_prices_fetched_at
  ON gold_prices (fetched_at DESC);

-- Alert subscribers table
CREATE TABLE IF NOT EXISTS alert_subscribers (
  id         BIGSERIAL PRIMARY KEY,
  email      TEXT           NOT NULL UNIQUE,
  opted_in   BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Row-Level Security: only allow service role to insert/update/delete
ALTER TABLE gold_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads for gold_prices (powers the public chart)
CREATE POLICY "Public can read gold_prices"
  ON gold_prices FOR SELECT
  TO anon
  USING (true);

-- Service role bypass (used by server-side code with the service role key)
-- No explicit policy needed; service_role bypasses RLS by default.
