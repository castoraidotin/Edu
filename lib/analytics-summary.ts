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
  event_name: FunnelEvent['name']
  event_props: Record<string, unknown> | null
  user_email: string | null
  created_at: string
}

export interface AnalyticsSummary {
  windowDays: number
  totalEvents: number
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

export async function getAnalyticsSummary(): Promise<AnalyticsSummary | null> {
  const since = new Date(Date.now() - RECENT_EVENTS_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('analytics_events')
    .select('event_name, event_props, user_email, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(RECENT_EVENTS_LIMIT)

  if (error) return null

  const events = (data ?? []) as EventRow[]

  const countsByEvent: Record<string, number> = {}
  const countsByDomain: Record<string, number> = {}
  const countsByCtaLocation: Record<string, number> = {}
  let quizCompletedCount = 0
  let quizCompletedScoreSum = 0

  for (const row of events) {
    countsByEvent[row.event_name] = (countsByEvent[row.event_name] ?? 0) + 1

    if (row.event_name === 'domain_selected') {
      const domain = propString(row, 'domain')
      if (domain) countsByDomain[domain] = (countsByDomain[domain] ?? 0) + 1
    }

    if (row.event_name === 'cta_clicked') {
      const location = propString(row, 'location')
      if (location) countsByCtaLocation[location] = (countsByCtaLocation[location] ?? 0) + 1
    }

    if (row.event_name === 'quiz_completed') {
      const score = row.event_props?.score
      if (typeof score === 'number') {
        quizCompletedCount += 1
        quizCompletedScoreSum += score
      }
    }
  }

  return {
    windowDays: RECENT_EVENTS_WINDOW_DAYS,
    totalEvents: events.length,
    countsByEvent,
    countsByDomain,
    countsByCtaLocation,
    averageQuizScore: quizCompletedCount > 0 ? quizCompletedScoreSum / quizCompletedCount : null,
    recentEvents: events.slice(0, RECENT_FEED_LIMIT).map((row) => ({
      eventName: row.event_name,
      props: row.event_props,
      userEmail: row.user_email,
      createdAt: row.created_at,
    })),
  }
}
