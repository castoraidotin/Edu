/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/analytics/track/route'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: { from: jest.fn() },
}))
jest.mock('@/lib/rate-limit', () => ({ isRateLimited: jest.fn() }))

import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { isRateLimited } from '@/lib/rate-limit'

const mockAuth = auth as jest.Mock
const mockFrom = supabaseAdmin.from as jest.Mock
const mockIsRateLimited = isRateLimited as jest.Mock

function makeRequest(body: object, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

function mockInsert(error: object | null = null) {
  const insertMock = jest.fn().mockResolvedValue({ error })
  mockFrom.mockReturnValue({ insert: insertMock })
  return insertMock
}

describe('POST /api/analytics/track', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue(null)
    mockIsRateLimited.mockResolvedValue(false)
  })

  it('returns 204 for a minimal valid anonymous event', async () => {
    mockInsert()
    const res = await POST(makeRequest({ name: 'landing_viewed' }))
    expect(res.status).toBe(204)
  })

  it('writes user_email from the session when authenticated', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'jane@example.com' } })
    const insertMock = mockInsert()
    await POST(makeRequest({ name: 'domain_selected', props: { domain: 'ai' } }))
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ user_email: 'jane@example.com' })
    )
  })

  it('writes user_email as null for an anonymous event', async () => {
    const insertMock = mockInsert()
    await POST(makeRequest({ name: 'landing_viewed' }))
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ user_email: null }))
  })

  it('returns 400 for an unknown event name', async () => {
    const res = await POST(makeRequest({ name: 'not_a_real_event' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when props is not an object', async () => {
    const res = await POST(makeRequest({ name: 'landing_viewed', props: 'nope' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when props is an array', async () => {
    const res = await POST(makeRequest({ name: 'landing_viewed', props: ['a', 'b'] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when props contains a nested object', async () => {
    const res = await POST(
      makeRequest({ name: 'domain_selected', props: { domain: { nested: true } } })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when props contains an array value', async () => {
    const res = await POST(makeRequest({ name: 'domain_selected', props: { domain: ['ai'] } }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when a props string value is too long', async () => {
    const res = await POST(
      makeRequest({ name: 'domain_selected', props: { domain: 'a'.repeat(501) } })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when session_id is too long', async () => {
    const res = await POST(
      makeRequest({ name: 'landing_viewed', session_id: 'a'.repeat(65) })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when url is too long', async () => {
    const res = await POST(makeRequest({ name: 'landing_viewed', url: 'a'.repeat(513) }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    mockIsRateLimited.mockResolvedValue(true)
    const res = await POST(makeRequest({ name: 'landing_viewed' }))
    expect(res.status).toBe(429)
  })

  it('returns 204 (not 500) when the Supabase insert fails', async () => {
    mockInsert({ message: 'DB error' })
    const res = await POST(makeRequest({ name: 'landing_viewed' }))
    expect(res.status).toBe(204)
  })

  it('inserts the full expected row shape', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'jane@example.com' } })
    const insertMock = mockInsert()
    await POST(
      makeRequest(
        {
          name: 'cta_clicked',
          props: { location: 'quiz_badge', brand: 'castor' },
          session_id: 'session-abc',
          url: '/test/ai',
        },
        { 'user-agent': 'test-agent/1.0' }
      )
    )
    expect(insertMock).toHaveBeenCalledWith({
      event_name: 'cta_clicked',
      event_props: { location: 'quiz_badge', brand: 'castor' },
      user_email: 'jane@example.com',
      session_id: 'session-abc',
      url: '/test/ai',
      user_agent: 'test-agent/1.0',
    })
  })

  it('inserts null for optional fields when omitted', async () => {
    const insertMock = mockInsert()
    await POST(makeRequest({ name: 'landing_viewed' }))
    expect(insertMock).toHaveBeenCalledWith({
      event_name: 'landing_viewed',
      event_props: null,
      user_email: null,
      session_id: null,
      url: null,
      user_agent: null,
    })
  })
})
