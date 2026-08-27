/**
 * @jest-environment node
 *
 * Tests the landing page server component.
 * Authenticated users are redirected to /dashboard; guests see the page.
 */

jest.mock('next/navigation', () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`)
  }),
}))

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('next/link', () => ({ __esModule: true, default: ({ children }: { href: string; children: React.ReactNode }) => children }))
jest.mock('@/components/HomeSignupForm', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/LogoutButton', () => ({ __esModule: true, default: () => <button>Log out</button> }))

import Home from '@/app/page'
import { auth } from '@/auth'
import { renderToStaticMarkup } from 'react-dom/server'

const mockAuth = auth as jest.Mock

describe('Landing page', () => {
  beforeEach(() => jest.clearAllMocks())

  it('redirects authenticated users to /dashboard', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } })
    try {
      await Home()
      throw new Error('Expected redirect')
    } catch (err) {
      expect((err as Error).message).toBe('NEXT_REDIRECT:/dashboard')
    }
  })

  it('renders the page for unauthenticated users without redirecting', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await Home()
    expect(result).toBeDefined()
  })

  it('renders the landing page for an authenticated unavailable user who explicitly returns home', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } })
    const result = await Home({ searchParams: Promise.resolve({ from: 'coming-soon' }) })
    const markup = renderToStaticMarkup(result)
    expect(markup).toContain('test@test.com')
    expect(markup).toContain('Log out')
    expect(markup).not.toContain('Sign in to your account')
  })
})
