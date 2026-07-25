/**
 * @jest-environment node
 */
jest.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: { from: jest.fn() },
}))

import { getAnalyticsSummary } from '@/lib/analytics-summary'
import { supabaseAdmin } from '@/lib/supabase-server'

const mockFrom = supabaseAdmin.from as jest.Mock

function mockEvents(data: object[] | null, error: object | null = null) {
  mockFrom.mockReturnValue({
    select: jest.fn().mockReturnValue({
      gte: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data, error }),
        }),
      }),
    }),
  })
}

// Every field a row needs; individual tests override only what they exercise.
function row(overrides: Partial<{
  id: string
  event_name: string
  event_props: Record<string, unknown> | null
  user_email: string | null
  session_id: string | null
  created_at: string
}>) {
  return {
    id: 'row-1',
    event_name: 'landing_viewed',
    event_props: null,
    user_email: null,
    session_id: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('getAnalyticsSummary', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns null when the query errors', async () => {
    mockEvents(null, { message: 'DB error' })
    await expect(getAnalyticsSummary()).resolves.toBeNull()
  })

  it('returns zeroed-out data when there are no events', async () => {
    mockEvents([])
    const summary = await getAnalyticsSummary()
    expect(summary?.totalEvents).toBe(0)
    expect(summary?.uniqueVisitors).toBe(0)
    expect(summary?.countsByEvent).toEqual({})
    expect(summary?.averageQuizScore).toBeNull()
    expect(summary?.recentEvents).toEqual([])
  })

  describe('visitor deduplication', () => {
    it('counts the same logged-in user clicking repeatedly as one visitor', async () => {
      mockEvents([
        row({ id: '1', event_name: 'stats_viewed', user_email: 'a@test.com', created_at: '2026-01-01T00:00:00Z' }),
        row({ id: '2', event_name: 'stats_viewed', user_email: 'a@test.com', created_at: '2026-01-01T00:01:00Z' }),
        row({ id: '3', event_name: 'stats_viewed', user_email: 'a@test.com', created_at: '2026-01-01T00:02:00Z' }),
      ])
      const summary = await getAnalyticsSummary()
      // 3 raw rows, but all one visitor — the funnel count must be 1, not 3.
      expect(summary?.totalEvents).toBe(3)
      expect(summary?.countsByEvent.stats_viewed).toBe(1)
      expect(summary?.uniqueVisitors).toBe(1)
    })

    it('counts two different logged-in users as two visitors', async () => {
      mockEvents([
        row({ id: '1', event_name: 'stats_viewed', user_email: 'a@test.com' }),
        row({ id: '2', event_name: 'stats_viewed', user_email: 'b@test.com' }),
      ])
      const summary = await getAnalyticsSummary()
      expect(summary?.countsByEvent.stats_viewed).toBe(2)
      expect(summary?.uniqueVisitors).toBe(2)
    })

    it('dedupes anonymous events by session_id when there is no user_email', async () => {
      mockEvents([
        row({ id: '1', event_name: 'landing_viewed', session_id: 'sess-a' }),
        row({ id: '2', event_name: 'landing_viewed', session_id: 'sess-a' }),
        row({ id: '3', event_name: 'landing_viewed', session_id: 'sess-b' }),
      ])
      const summary = await getAnalyticsSummary()
      // sess-a fired twice (still one visitor), sess-b once — two visitors total.
      expect(summary?.countsByEvent.landing_viewed).toBe(2)
      expect(summary?.uniqueVisitors).toBe(2)
    })

    it('falls back to the row id when both user_email and session_id are missing', async () => {
      mockEvents([
        row({ id: '1', event_name: 'landing_viewed', user_email: null, session_id: null }),
        row({ id: '2', event_name: 'landing_viewed', user_email: null, session_id: null }),
      ])
      const summary = await getAnalyticsSummary()
      // No shared identity between them, so each counts as its own visitor —
      // this must never accidentally collide unrelated anonymous rows.
      expect(summary?.countsByEvent.landing_viewed).toBe(2)
    })
  })

  it('counts domain_selected visitors by domain, not raw rows', async () => {
    mockEvents([
      row({ id: '1', event_name: 'domain_selected', event_props: { domain: 'ai' }, user_email: 'a@test.com' }),
      row({ id: '2', event_name: 'domain_selected', event_props: { domain: 'ai' }, user_email: 'a@test.com' }),
      row({ id: '3', event_name: 'domain_selected', event_props: { domain: 'cloud' }, user_email: 'b@test.com' }),
    ])
    const summary = await getAnalyticsSummary()
    // a@test.com picked 'ai' twice — still one visitor for that domain.
    expect(summary?.countsByDomain).toEqual({ ai: 1, cloud: 1 })
  })

  it('counts cta_clicked visitors by location, not raw rows', async () => {
    mockEvents([
      row({ id: '1', event_name: 'cta_clicked', event_props: { location: 'quiz_badge' }, session_id: 'sess-a' }),
      row({ id: '2', event_name: 'cta_clicked', event_props: { location: 'quiz_badge' }, session_id: 'sess-a' }),
      row({ id: '3', event_name: 'cta_clicked', event_props: { location: 'quiz_interstitial' }, session_id: 'sess-b' }),
    ])
    const summary = await getAnalyticsSummary()
    expect(summary?.countsByCtaLocation).toEqual({ quiz_badge: 1, quiz_interstitial: 1 })
  })

  it('does NOT dedupe quiz_completed scores — every completion is a real result', async () => {
    mockEvents([
      row({ id: '1', event_name: 'quiz_completed', event_props: { domain: 'ai', score: 8 }, user_email: 'a@test.com' }),
      row({ id: '2', event_name: 'quiz_completed', event_props: { domain: 'ai', score: 6 }, user_email: 'a@test.com' }),
    ])
    const summary = await getAnalyticsSummary()
    // Same visitor retook the quiz — both real scores must still be averaged.
    expect(summary?.averageQuizScore).toBe(7)
    expect(summary?.quizCompletionCount).toBe(2)
  })

  it('ignores malformed props instead of throwing', async () => {
    mockEvents([
      row({ id: '1', event_name: 'domain_selected', event_props: null }),
      row({ id: '2', event_name: 'cta_clicked', event_props: { location: 42 } }),
      row({ id: '3', event_name: 'quiz_completed', event_props: { score: 'not-a-number' } }),
    ])
    const summary = await getAnalyticsSummary()
    expect(summary?.countsByDomain).toEqual({})
    expect(summary?.countsByCtaLocation).toEqual({})
    expect(summary?.averageQuizScore).toBeNull()
  })

  it('caps the recent events feed at 50 even with more events in the window', async () => {
    const rows = Array.from({ length: 75 }, (_, i) =>
      row({ id: `${i}`, event_name: 'landing_viewed', created_at: `2026-01-01T00:${String(i).padStart(2, '0')}:00Z` })
    )
    mockEvents(rows)
    const summary = await getAnalyticsSummary()
    expect(summary?.totalEvents).toBe(75)
    expect(summary?.recentEvents.length).toBe(50)
  })
})
