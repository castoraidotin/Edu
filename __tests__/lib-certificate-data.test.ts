/** @jest-environment node */

jest.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: { from: jest.fn() },
}))
jest.mock('@/lib/latest-results', () => ({
  latestResultsForDomain: jest.fn(),
}))

import { getCertificateData, getFirstCertificateForUser } from '@/lib/certificate-data'
import { supabaseAdmin } from '@/lib/supabase-server'
import { latestResultsForDomain } from '@/lib/latest-results'

const mockFrom = supabaseAdmin.from as jest.Mock
const mockLatestResultsForDomain = latestResultsForDomain as jest.Mock
const FIRST_ATTEMPT_ID = '11111111-1111-4111-8111-111111111111'
const RETAKE_ATTEMPT_ID = '22222222-2222-4222-8222-222222222222'

function queryResult(data: unknown, error: unknown = null) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  }
}

function profileListQuery(data: unknown, error: unknown = null) {
  return {
    select: jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({ data, error }),
    }),
  }
}

const HYDERABAD_PROFILES = [
  { email: 'learner@example.com', city: 'Hyderabad' },
  { email: 'higher@example.com', city: 'Hyderabad' },
  { email: 'lower-a@example.com', city: 'Hyderabad' },
  { email: 'lower-b@example.com', city: 'Mumbai' },
]

describe('certificate data', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockLatestResultsForDomain.mockResolvedValue({
      data: [
        { user_email: 'learner@example.com', score: 9, time_taken_seconds: 100, completed_at: '2026-08-20' },
        { user_email: 'higher@example.com', score: 10, time_taken_seconds: 100, completed_at: '2026-08-20' },
        { user_email: 'lower-a@example.com', score: 4, time_taken_seconds: 100, completed_at: '2026-08-20' },
        { user_email: 'lower-b@example.com', score: 2, time_taken_seconds: 100, completed_at: '2026-08-20' },
      ],
      error: null,
    })
  })

  it('locks the certificate to the earliest completed AI result', async () => {
    const query = queryResult({
      id: 'result-1',
      quiz_attempt_id: FIRST_ATTEMPT_ID,
      score: 6,
      completed_at: '2026-08-01T10:00:00.000Z',
    })
    mockFrom
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(profileListQuery(HYDERABAD_PROFILES))

    await expect(getFirstCertificateForUser('learner@example.com')).resolves.toEqual({
      attemptId: FIRST_ATTEMPT_ID,
      score: 6,
      completedAt: '2026-08-01T10:00:00.000Z',
      topPercent: 67,
      cohortSize: 3,
      city: 'Hyderabad',
    })

    expect(query.eq).toHaveBeenCalledWith('domain', 'ai')
    expect(query.order).toHaveBeenNthCalledWith(1, 'completed_at', { ascending: true })
    expect(query.order).toHaveBeenNthCalledWith(2, 'id', { ascending: true })
    expect(query.limit).toHaveBeenCalledWith(1)
  })

  it('rejects a public certificate URL for a later retake', async () => {
    mockFrom
      .mockReturnValueOnce(
        queryResult({
          user_email: 'learner@example.com',
          score: 10,
          completed_at: '2026-08-20T10:00:00.000Z',
        }),
      )
      .mockReturnValueOnce(
        queryResult({
          id: 'result-1',
          quiz_attempt_id: FIRST_ATTEMPT_ID,
          score: 6,
          completed_at: '2026-08-01T10:00:00.000Z',
        }),
      )
      .mockReturnValueOnce(profileListQuery(HYDERABAD_PROFILES))

    await expect(getCertificateData(RETAKE_ATTEMPT_ID)).resolves.toBeNull()
    expect(mockFrom).toHaveBeenCalledTimes(3)
  })

  it('returns the first certificate with the learner profile name', async () => {
    mockFrom
      .mockReturnValueOnce(
        queryResult({
          user_email: 'learner@example.com',
          score: 6,
          completed_at: '2026-08-01T10:00:00.000Z',
        }),
      )
      .mockReturnValueOnce(
        queryResult({
          id: 'result-1',
          quiz_attempt_id: FIRST_ATTEMPT_ID,
          score: 6,
          completed_at: '2026-08-01T10:00:00.000Z',
        }),
      )
      .mockReturnValueOnce(profileListQuery(HYDERABAD_PROFILES))
      .mockReturnValueOnce(queryResult({ full_name: 'Test Learner' }))

    await expect(getCertificateData(FIRST_ATTEMPT_ID)).resolves.toEqual({
      attemptId: FIRST_ATTEMPT_ID,
      recipientName: 'Test Learner',
      score: 6,
      completedAt: '2026-08-01T10:00:00.000Z',
      topPercent: 67,
      cohortSize: 3,
      city: 'Hyderabad',
    })
  })
})
