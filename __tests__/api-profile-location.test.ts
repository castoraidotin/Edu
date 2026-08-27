/** @jest-environment node */
import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/profile/location/route'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase-server'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/supabase-server', () => ({ supabaseAdmin: { from: jest.fn() } }))

const mockAuth = auth as jest.Mock
const mockFrom = supabaseAdmin.from as jest.Mock

function request(city: string) {
  return new NextRequest('http://localhost/api/profile/location', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state_region: 'Telangana', city }),
  })
}

describe('PATCH /api/profile/location', () => {
  beforeEach(() => jest.clearAllMocks())

  it('saves only the early availability fields and returns the availability result', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    const upsert = jest.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ upsert })

    const response = await PATCH(request('Warangal'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ available: false })
    expect(upsert).toHaveBeenCalledWith({
      email: 'test@example.com',
      country: 'India',
      state_region: 'Telangana',
      city: 'Warangal',
    }, { onConflict: 'email' })
  })

  it('returns available for Hyderabad without exposing the eligible city to the client', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    mockFrom.mockReturnValue({ upsert: jest.fn().mockResolvedValue({ error: null }) })
    const response = await PATCH(request('Hyderabad'))
    expect(await response.json()).toEqual({ available: true })
  })

  it('requires authentication', async () => {
    mockAuth.mockResolvedValue(null)
    const response = await PATCH(request('Warangal'))
    expect(response.status).toBe(401)
  })
})
