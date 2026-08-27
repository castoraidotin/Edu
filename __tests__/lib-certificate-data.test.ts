/** @jest-environment node */

jest.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: { from: jest.fn() },
}))

import { getCertificateData, getFirstCertificateForUser } from '@/lib/certificate-data'
import { supabaseAdmin } from '@/lib/supabase-server'

const mockFrom = supabaseAdmin.from as jest.Mock
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

describe('certificate data', () => {
  beforeEach(() => jest.clearAllMocks())

  it('locks the certificate to the earliest completed AI result', async () => {
    const query = queryResult({
      id: 'result-1',
      quiz_attempt_id: FIRST_ATTEMPT_ID,
      score: 6,
      completed_at: '2026-08-01T10:00:00.000Z',
    })
    mockFrom.mockReturnValue(query)

    await expect(getFirstCertificateForUser('learner@example.com')).resolves.toEqual({
      attemptId: FIRST_ATTEMPT_ID,
      score: 6,
      completedAt: '2026-08-01T10:00:00.000Z',
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

    await expect(getCertificateData(RETAKE_ATTEMPT_ID)).resolves.toBeNull()
    expect(mockFrom).toHaveBeenCalledTimes(2)
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
      .mockReturnValueOnce(queryResult({ full_name: 'Test Learner' }))

    await expect(getCertificateData(FIRST_ATTEMPT_ID)).resolves.toEqual({
      attemptId: FIRST_ATTEMPT_ID,
      recipientName: 'Test Learner',
      score: 6,
      completedAt: '2026-08-01T10:00:00.000Z',
    })
  })
})
