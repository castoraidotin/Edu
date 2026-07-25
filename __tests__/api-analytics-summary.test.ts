/**
 * @jest-environment node
 */
jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/analytics-summary', () => ({ getAnalyticsSummary: jest.fn() }))

import { GET } from '@/app/api/analytics/summary/route'
import { auth } from '@/auth'
import { getAnalyticsSummary } from '@/lib/analytics-summary'

const mockAuth = auth as jest.Mock
const mockGetAnalyticsSummary = getAnalyticsSummary as jest.Mock

const ADMIN_EMAIL = 'admin@example.com'

describe('GET /api/analytics/summary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ADMIN_EMAILS = ADMIN_EMAIL
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 403 when authenticated but not an admin', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'someone-else@example.com' } })
    const res = await GET()
    expect(res.status).toBe(403)
    expect(mockGetAnalyticsSummary).not.toHaveBeenCalled()
  })

  it('returns 200 with the summary for an admin', async () => {
    mockAuth.mockResolvedValue({ user: { email: ADMIN_EMAIL } })
    mockGetAnalyticsSummary.mockResolvedValue({
      windowDays: 30,
      totalEvents: 3,
      countsByEvent: { landing_viewed: 3 },
      countsByDomain: {},
      countsByCtaLocation: {},
      averageQuizScore: null,
      recentEvents: [],
    })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.totalEvents).toBe(3)
  })

  it('returns 500 when the summary query fails', async () => {
    mockAuth.mockResolvedValue({ user: { email: ADMIN_EMAIL } })
    mockGetAnalyticsSummary.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
