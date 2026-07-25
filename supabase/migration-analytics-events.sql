-- Funnel event storage for the Vercel Hobby plan pivot: Vercel Web Analytics
-- gates all custom events behind a Pro plan, so events are also written here.
-- Apply after schema.sql and migration-assessment-hardening.sql.

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL CHECK (event_name IN (
    'landing_viewed', 'signup_started', 'signup_completed',
    'domain_selected', 'quiz_started', 'quiz_completed',
    'result_viewed', 'stats_viewed', 'cta_clicked'
  )),
  event_props JSONB,
  -- Nullable: landing_viewed / signup_started fire before a user is
  -- authenticated, so there is no FK into profiles(email) here.
  user_email TEXT,
  session_id TEXT,
  url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS is enabled with zero policies, so only a role that bypasses RLS can
-- touch this table. All access goes through supabaseAdmin (service_role) from
-- the /api/analytics/track route — never directly from the client — matching
-- the quiz_attempts table's lockdown pattern.
GRANT SELECT, INSERT ON analytics_events TO service_role;

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_time
  ON analytics_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_email_time
  ON analytics_events (user_email, created_at DESC)
  WHERE user_email IS NOT NULL;
