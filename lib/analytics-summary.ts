import { supabaseAdmin } from '@/lib/supabase-server'
import type { FunnelEvent } from '@/lib/analytics'

// Shared by the internal analytics dashboard page (app/admin/analytics) and
// its API route (app/api/analytics/summary) so the aggregation logic lives
// in exactly one place. Reads a bounded recent window of analytics_events and
// aggregates it in memory rather than via a Postgres function, since this is
// a low-traffic reporting page, not a hot path.
const RECENT_EVENTS_WINDOW_DAYS = 30
const RECENT_EVENTS_LIMIT = 5000
const RECENT_FEED_LIMIT = 50

interface EventRow {
  id: string
  event_name: FunnelEvent['name']
  event_props: Record<string, unknown> | null
  user_email: string | null
  session_id: string | null
  created_at: string
}

export interface AnalyticsSummary {
  windowDays: number
  totalEvents: number
  uniqueVisitors: number
  countsByEvent: Record<string, number>
  countsByDomain: Record<string, number>
  countsByCtaLocation: Record<string, number>
  averageQuizScore: number | null
  recentEvents: {
    eventName: FunnelEvent['name']
    props: Record<string, unknown> | null
    userEmail: string | null
    createdAt: string
  }[]
}

function propString(row: EventRow, key: string): string | null {
  const value = row.event_props?.[key]
  return typeof value === 'string' ? value : null
}

// A logged-in user's email is a real identity, so it's used first. An
// anonymous visitor is identified by the per-browser-tab session_id
// lib/analytics.ts attaches to every event. If somehow neither is present
// (storage disabled, very old row before session_id existed), the row's own
// id is used so it counts as its own visitor rather than colliding with
// every other unattributed row.
function visitorKey(row: EventRow): string {
  return row.user_email ?? row.session_id ?? `row:${row.id}`
}

// Counts unique visitors per event/domain/location, not raw row counts — a
// single bored visitor clicking "Stats" 30 times must not look like 30
// people used the feature. Every count in the funnel and the two breakdown
// cards is a Set size, not a running total.
export async function getAnalyticsSummary(): Promise<AnalyticsSummary | null> {
  const since = new Date(Date.now() - RECENT_EVENTS_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('analytics_events')
    .select('id, event_name, event_props, user_email, session_id, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(RECENT_EVENTS_LIMIT)

  if (error) return null

  const events = (data ?? []) as EventRow[]

  const visitorsByEvent: Record<string, Set<string>> = {}
  const visitorsByDomain: Record<string, Set<string>> = {}
  const visitorsByCtaLocation: Record<string, Set<string>> = {}
  const allVisitors = new Set<string>()
  let quizCompletedCount = 0
  let quizCompletedScoreSum = 0

  for (const row of events) {
    const visitor = visitorKey(row)
    allVisitors.add(visitor)

    ;(visitorsByEvent[row.event_name] ??= new Set()).add(visitor)

    if (row.event_name === 'domain_selected') {
      const domain = propString(row, 'domain')
      if (domain) (visitorsByDomain[domain] ??= new Set()).add(visitor)
    }

    if (row.event_name === 'cta_clicked') {
      const location = propString(row, 'location')
      if (location) (visitorsByCtaLocation[location] ??= new Set()).add(visitor)
    }

    // Not deduped: a visitor who retakes the quiz produces a genuinely new
    // score each time, unlike a repeated click, so every completion counts.
    if (row.event_name === 'quiz_completed') {
      const score = row.event_props?.score
      if (typeof score === 'number') {
        quizCompletedCount += 1
        quizCompletedScoreSum += score
      }
    }
  }

  const toCounts = (sets: Record<string, Set<string>>): Record<string, number> =>
    Object.fromEntries(Object.entries(sets).map(([key, set]) => [key, set.size]))

  return {
    windowDays: RECENT_EVENTS_WINDOW_DAYS,
    totalEvents: events.length,
    uniqueVisitors: allVisitors.size,
    countsByEvent: toCounts(visitorsByEvent),
    countsByDomain: toCounts(visitorsByDomain),
    countsByCtaLocation: toCounts(visitorsByCtaLocation),
    averageQuizScore: quizCompletedCount > 0 ? quizCompletedScoreSum / quizCompletedCount : null,
    recentEvents: events.slice(0, RECENT_FEED_LIMIT).map((row) => ({
      eventName: row.event_name,
      props: row.event_props,
      userEmail: row.user_email,
      createdAt: row.created_at,
    })),
  }
}
