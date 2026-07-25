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
    expect(summary?.countsByEvent).toEqual({})
    expect(summary?.averageQuizScore).toBeNull()
    expect(summary?.recentEvents).toEqual([])
  })

  it('counts events by name', async () => {
    mockEvents([
      { event_name: 'landing_viewed', event_props: null, user_email: null, created_at: '2026-01-01T00:00:00Z' },
      { event_name: 'landing_viewed', event_props: null, user_email: null, created_at: '2026-01-01T00:01:00Z' },
      { event_name: 'domain_selected', event_props: { domain: 'ai' }, user_email: 'a@test.com', created_at: '2026-01-01T00:02:00Z' },
    ])
    const summary = await getAnalyticsSummary()
    expect(summary?.countsByEvent).toEqual({ landing_viewed: 2, domain_selected: 1 })
  })

  it('breaks domain_selected down by domain', async () => {
    mockEvents([
      { event_name: 'domain_selected', event_props: { domain: 'ai' }, user_email: null, created_at: '2026-01-01T00:00:00Z' },
      { event_name: 'domain_selected', event_props: { domain: 'ai' }, user_email: null, created_at: '2026-01-01T00:01:00Z' },
      { event_name: 'domain_selected', event_props: { domain: 'cloud' }, user_email: null, created_at: '2026-01-01T00:02:00Z' },
    ])
    const summary = await getAnalyticsSummary()
    expect(summary?.countsByDomain).toEqual({ ai: 2, cloud: 1 })
  })

  it('breaks cta_clicked down by location', async () => {
    mockEvents([
      { event_name: 'cta_clicked', event_props: { location: 'quiz_badge', brand: 'castor' }, user_email: null, created_at: '2026-01-01T00:00:00Z' },
      { event_name: 'cta_clicked', event_props: { location: 'quiz_interstitial', brand: 'castor' }, user_email: null, created_at: '2026-01-01T00:01:00Z' },
    ])
    const summary = await getAnalyticsSummary()
    expect(summary?.countsByCtaLocation).toEqual({ quiz_badge: 1, quiz_interstitial: 1 })
  })

  it('averages quiz_completed scores', async () => {
    mockEvents([
      { event_name: 'quiz_completed', event_props: { domain: 'ai', score: 8 }, user_email: null, created_at: '2026-01-01T00:00:00Z' },
      { event_name: 'quiz_completed', event_props: { domain: 'ai', score: 6 }, user_email: null, created_at: '2026-01-01T00:01:00Z' },
    ])
    const summary = await getAnalyticsSummary()
    expect(summary?.averageQuizScore).toBe(7)
  })

  it('ignores malformed props instead of throwing', async () => {
    mockEvents([
      { event_name: 'domain_selected', event_props: null, user_email: null, created_at: '2026-01-01T00:00:00Z' },
      { event_name: 'cta_clicked', event_props: { location: 42 }, user_email: null, created_at: '2026-01-01T00:01:00Z' },
      { event_name: 'quiz_completed', event_props: { score: 'not-a-number' }, user_email: null, created_at: '2026-01-01T00:02:00Z' },
    ])
    const summary = await getAnalyticsSummary()
    expect(summary?.countsByDomain).toEqual({})
    expect(summary?.countsByCtaLocation).toEqual({})
    expect(summary?.averageQuizScore).toBeNull()
  })

  it('caps the recent events feed at 50 even with more events in the window', async () => {
    const rows = Array.from({ length: 75 }, (_, i) => ({
      event_name: 'landing_viewed',
      event_props: null,
      user_email: null,
      created_at: `2026-01-01T00:${String(i).padStart(2, '0')}:00Z`,
    }))
    mockEvents(rows)
    const summary = await getAnalyticsSummary()
    expect(summary?.totalEvents).toBe(75)
    expect(summary?.recentEvents.length).toBe(50)
  })
})
