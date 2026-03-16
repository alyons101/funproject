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

-- Row-Level Security
ALTER TABLE gold_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads for gold_prices (powers the public chart)
CREATE POLICY "Public can read gold_prices"
  ON gold_prices FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous inserts for gold_prices (used by cron job with anon key)
-- WITH CHECK ensures only positive prices are inserted (basic sanity check)
CREATE POLICY "Anon can insert gold_prices"
  ON gold_prices FOR INSERT
  TO anon
  WITH CHECK (price_usd > 0);

-- Allow anonymous reads for alert_subscribers
CREATE POLICY "Anon can read alert_subscribers"
  ON alert_subscribers FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous inserts for alert_subscribers (email sign-up)
-- WITH CHECK enforces basic email format at the database level
CREATE POLICY "Anon can insert alert_subscribers"
  ON alert_subscribers FOR INSERT
  TO anon
  WITH CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- Allow anonymous updates for alert_subscribers (opt-in/opt-out)
-- USING ensures updates are only applied to rows matching the email format
CREATE POLICY "Anon can update alert_subscribers"
  ON alert_subscribers FOR UPDATE
  TO anon
  USING (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
  WITH CHECK (true);

-- Service role bypass (used by server-side code with the service role key)
-- No explicit policy needed; service_role bypasses RLS by default.
