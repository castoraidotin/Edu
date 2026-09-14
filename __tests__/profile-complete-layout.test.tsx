/**
 * @jest-environment node
 */

import CompleteProfileLayout from '@/app/profile/complete/layout'
import { getProductAccessState } from '@/lib/product-access-server'
import { redirect } from 'next/navigation'

jest.mock('@/lib/product-access-server', () => ({
  getProductAccessState: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`)
  }),
}))

const mockGetProductAccessState = getProductAccessState as jest.Mock
const mockRedirect = redirect as unknown as jest.Mock

describe('CompleteProfileLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects signed-out visitors to login', async () => {
    mockGetProductAccessState.mockResolvedValue({ status: 'signed-out', profile: null, session: null })

    await expect(CompleteProfileLayout({ children: 'form' })).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('redirects users with a completed profile to the dashboard', async () => {
    mockGetProductAccessState.mockResolvedValue({ status: 'available', profile: {}, session: {} })

    await expect(CompleteProfileLayout({ children: 'form' })).rejects.toThrow('NEXT_REDIRECT:/dashboard')
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })

  it('renders onboarding only for an incomplete profile', async () => {
    mockGetProductAccessState.mockResolvedValue({ status: 'profile-incomplete', profile: {}, session: {} })

    await expect(CompleteProfileLayout({ children: 'form' })).resolves.toBe('form')
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})
