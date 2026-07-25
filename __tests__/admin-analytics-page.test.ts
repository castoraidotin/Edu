/**
 * @jest-environment node
 *
 * Tests the auth + admin-allowlist gate on the internal analytics page.
 * redirect() is made to throw so we can assert which path it was called with,
 * matching the pattern used in __tests__/dashboard.test.ts.
 */
jest.mock('next/navigation', () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`)
  }),
}))
jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/analytics-summary', () => ({ getAnalyticsSummary: jest.fn() }))
jest.mock('@/components/UserMenu', () => ({ __esModule: true, default: () => null }))

import AdminAnalyticsPage from '@/app/admin/analytics/page'
import { auth } from '@/auth'
import { getAnalyticsSummary } from '@/lib/analytics-summary'

const mockAuth = auth as jest.Mock
const mockGetAnalyticsSummary = getAnalyticsSummary as jest.Mock

const ADMIN_EMAIL = 'admin@example.com'

async function expectRedirectTo(path: string, fn: () => Promise<unknown>) {
  try {
    await fn()
    throw new Error('Expected redirect but none was thrown')
  } catch (err) {
    expect((err as Error).message).toBe(`NEXT_REDIRECT:${path}`)
  }
}

describe('AdminAnalyticsPage — access gate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ADMIN_EMAILS = ADMIN_EMAIL
  })

  it('redirects to /login when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    await expectRedirectTo('/login', () => AdminAnalyticsPage())
  })

  it('redirects to /dashboard when authenticated but not an admin', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'someone-else@example.com' } })
    await expectRedirectTo('/dashboard', () => AdminAnalyticsPage())
  })

  it('renders for an admin', async () => {
    mockAuth.mockResolvedValue({ user: { email: ADMIN_EMAIL } })
    mockGetAnalyticsSummary.mockResolvedValue({
      windowDays: 30,
      totalEvents: 0,
      uniqueVisitors: 0,
      countsByEvent: {},
      countsByDomain: {},
      countsByCtaLocation: {},
      averageQuizScore: null,
      recentEvents: [],
    })
    await expect(AdminAnalyticsPage()).resolves.toBeDefined()
  })
})
