-- Employee identities
CREATE TABLE IF NOT EXISTS employee_identities (
  id SERIAL PRIMARY KEY,
  employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS employee_identities_provider_external_uniq
  ON employee_identities (provider, external_id);
CREATE INDEX IF NOT EXISTS employee_identities_email_idx
  ON employee_identities (email);
CREATE INDEX IF NOT EXISTS employee_identities_employee_provider_idx
  ON employee_identities (employee_id, provider);

-- Jibble credentials
CREATE TABLE IF NOT EXISTS jibble_credentials (
  id SERIAL PRIMARY KEY,
  org_id TEXT NOT NULL,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  authorized_by INT REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS jibble_credentials_org_uniq
  ON jibble_credentials (org_id);

-- Jibble logs
CREATE TABLE IF NOT EXISTS jibble_logs (
  id SERIAL PRIMARY KEY,
  employee_id INT REFERENCES employees(id) ON DELETE SET NULL,
  jibble_id TEXT NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  location TEXT,
  verification_method TEXT,
  gps_lat NUMERIC(9,6),
  gps_lng NUMERIC(9,6),
  checkin_photo_url TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS jibble_logs_jibble_id_uniq
  ON jibble_logs (jibble_id);
CREATE INDEX IF NOT EXISTS jibble_logs_employee_time_idx
  ON jibble_logs (employee_id, clock_in, clock_out);

-- Sync logs
CREATE TABLE IF NOT EXISTS sync_logs (
  id SERIAL PRIMARY KEY,
  integration TEXT NOT NULL,
  status TEXT NOT NULL,
  run_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INT,
  item_count INT,
  message TEXT,
  details JSONB
);

-- Jotform submissions
CREATE TABLE IF NOT EXISTS jotform_submissions (
  id SERIAL PRIMARY KEY,
  form_id TEXT NOT NULL,
  submission_id TEXT NOT NULL,
  employee_id INT REFERENCES employees(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS jotform_submissions_submission_uniq
  ON jotform_submissions (submission_id);
CREATE INDEX IF NOT EXISTS jotform_submissions_form_received_idx
  ON jotform_submissions (form_id, received_at);

-- Webhook outbox
CREATE TABLE IF NOT EXISTS webhook_outbox (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  target_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  attempts INT DEFAULT 0,
  last_error TEXT,
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);