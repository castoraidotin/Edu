/**
 * @jest-environment node
 *
 * Tests the profile-completion gate in the dashboard server component.
 * redirect() is made to throw so we can assert which path it was called with.
 */

jest.mock('next/navigation', () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`)
  }),
}))

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/supabase-server', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('@/components/DomainSelector', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/UserMenu', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/dashboard/DashboardShell', () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => children }))
jest.mock('@/components/dashboard/CastorPromoBanner', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/ui/ScoreGauge', () => ({ __esModule: true, default: () => null }))
jest.mock('@/lib/latest-results', () => ({ latestResultsForDomain: jest.fn() }))

import DashboardPage from '@/app/dashboard/page'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { latestResultsForDomain } from '@/lib/latest-results'
import { renderToStaticMarkup } from 'react-dom/server'

const mockAuth = auth as jest.Mock
const mockFrom = supabaseAdmin.from as jest.Mock
const mockLatestResultsForDomain = latestResultsForDomain as jest.Mock

const authedSession = { user: { email: 'test@test.com', name: 'Test User', id: 'uid-1' } }

function mockProfileSelect(
  profileData: Record<string, unknown> | null,
  results: Record<string, unknown>[] = [],
  peerProfiles: Record<string, unknown>[] = []
) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: profileData, error: null }),
          }),
          in: jest.fn().mockResolvedValue({ data: peerProfiles, error: null }),
        }),
      }
    }
    // test_results — return empty list so dashboard renders without crashing
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: results, error: null }),
        }),
      }),
    }
  })
}

async function expectRedirectTo(path: string, fn: () => Promise<unknown>) {
  try {
    await fn()
    throw new Error('Expected redirect but none was thrown')
  } catch (err) {
    expect((err as Error).message).toBe(`NEXT_REDIRECT:${path}`)
  }
}

describe('DashboardPage — profile completion gate', () => {
  beforeEach(() => jest.clearAllMocks())

  it('redirects to /login when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    await expectRedirectTo('/login', () => DashboardPage())
  })

  it('redirects to /profile/complete when profile_completed is false', async () => {
    mockAuth.mockResolvedValue(authedSession)
    mockProfileSelect({ profile_completed: false, country: null, state_region: null, city: null })
    await expectRedirectTo('/profile/complete', () => DashboardPage())
  })

  it('redirects to /profile/complete when profile_completed is null', async () => {
    mockAuth.mockResolvedValue(authedSession)
    mockProfileSelect({ profile_completed: null, country: null, state_region: null, city: null })
    await expectRedirectTo('/profile/complete', () => DashboardPage())
  })

  it('redirects existing users who have profile_completed=true but missing country', async () => {
    mockAuth.mockResolvedValue(authedSession)
    mockProfileSelect({ profile_completed: true, country: null, state_region: 'Telangana', city: 'Hyderabad' })
    await expectRedirectTo('/profile/complete', () => DashboardPage())
  })

  it('redirects existing users who have profile_completed=true but missing state_region', async () => {
    mockAuth.mockResolvedValue(authedSession)
    mockProfileSelect({ profile_completed: true, country: 'India', state_region: null, city: 'Hyderabad' })
    await expectRedirectTo('/profile/complete', () => DashboardPage())
  })

  it('redirects existing users who have profile_completed=true but missing city', async () => {
    mockAuth.mockResolvedValue(authedSession)
    mockProfileSelect({ profile_completed: true, country: 'India', state_region: 'Telangana', city: null })
    await expectRedirectTo('/profile/complete', () => DashboardPage())
  })

  it('allows access when profile_completed=true and all location fields are present', async () => {
    mockAuth.mockResolvedValue(authedSession)
    mockProfileSelect({ profile_completed: true, country: 'India', state_region: 'Telangana', city: 'Hyderabad' })
    // Should resolve to a React element — no redirect thrown
    await expect(DashboardPage()).resolves.toBeDefined()
  })

  it('does not apply a coming-soon gate to existing completed profiles', async () => {
    mockAuth.mockResolvedValue(authedSession)
    mockProfileSelect({ profile_completed: true, country: 'India', state_region: 'Telangana', city: 'Warangal' })
    await expect(DashboardPage()).resolves.toBeDefined()
  })

  it('teases the stats page with four real Hyderabad peer comparisons', async () => {
    mockAuth.mockResolvedValue(authedSession)
    mockLatestResultsForDomain.mockResolvedValue({
      data: [
        { user_email: 'peer-a@test.com', score: 10, time_taken_seconds: 170, completed_at: '2026-08-31T11:00:00.000Z' },
        { user_email: 'test@test.com', score: 9, time_taken_seconds: 180, completed_at: '2026-08-31T10:00:00.000Z' },
        { user_email: 'peer-b@test.com', score: 8, time_taken_seconds: 190, completed_at: '2026-08-31T09:00:00.000Z' },
        { user_email: 'peer-c@test.com', score: 6, time_taken_seconds: 210, completed_at: '2026-08-31T08:00:00.000Z' },
        { user_email: 'peer-d@test.com', score: 5, time_taken_seconds: 230, completed_at: '2026-08-31T07:00:00.000Z' },
      ],
      error: null,
    })
    mockProfileSelect(
      { profile_completed: true, country: 'India', state_region: 'Telangana', city: 'Hyderabad' },
      [
        { domain: 'ai', score: 9, time_taken_seconds: 180, completed_at: '2026-08-31T10:00:00.000Z' },
        { domain: 'cloud', score: 8, time_taken_seconds: 220, completed_at: '2026-08-30T10:00:00.000Z' },
        { domain: 'ai', score: 6, time_taken_seconds: 260, completed_at: '2026-08-29T10:00:00.000Z' },
      ],
      ['peer-a@test.com', 'test@test.com', 'peer-b@test.com', 'peer-c@test.com', 'peer-d@test.com']
        .map((email) => ({ email, city: 'Hyderabad' }))
    )

    const markup = renderToStaticMarkup(await DashboardPage())
    expect(markup).toContain('Your snapshot')
    expect(markup).toContain('Peers outscored')
    expect(markup).toContain('75%')
    expect(markup).toContain('Hyderabad rank')
    expect(markup).toContain('#2')
    expect(markup).toContain('of 5')
    expect(markup).toContain('Hyderabad average')
    expect(markup).toContain('7.6/10')
    expect(markup).toContain('Your score gap')
    expect(markup).toContain('+1.4 pts')
    expect(markup).toContain('See your percentile, peer rank, and score trends.')
    expect(markup).toContain('/stats?domain=ai')
  })
})
