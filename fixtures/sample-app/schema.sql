-- fixtures/sample-app/schema.sql
-- Full schema for the sample application.

CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  name           TEXT        NOT NULL,
  email          TEXT        NOT NULL UNIQUE,
  role           TEXT        NOT NULL DEFAULT 'user',
  active         BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS users_email_idx  ON users (email);
CREATE INDEX IF NOT EXISTS users_active_idx ON users (active) WHERE active = true;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx   ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        TEXT    NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  stock       INTEGER NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS orders (
  id          SERIAL      PRIMARY KEY,
  user_id     INTEGER     NOT NULL REFERENCES users (id),
  status      TEXT        NOT NULL DEFAULT 'open',
  total_cents INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL  PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders   (id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products (id),
  quantity   INTEGER NOT NULL DEFAULT 1
);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
  id             SERIAL      PRIMARY KEY,
  user_id        INTEGER     NOT NULL REFERENCES users (id),
  amount_cents   INTEGER     NOT NULL CHECK (amount_cents > 0),
  currency       TEXT        NOT NULL DEFAULT 'usd',
  status         TEXT        NOT NULL DEFAULT 'pending',
  failure_reason TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_user_id_idx    ON payments (user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx     ON payments (status);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON payments (created_at);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_log (
  id         SERIAL      PRIMARY KEY,
  user_id    INTEGER     REFERENCES users (id) ON DELETE SET NULL,
  event      TEXT        NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
