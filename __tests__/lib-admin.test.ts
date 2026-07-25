import { isAdminEmail } from '@/lib/admin'

describe('isAdminEmail', () => {
  const originalEnv = process.env.ADMIN_EMAILS

  afterEach(() => {
    process.env.ADMIN_EMAILS = originalEnv
  })

  it('returns false when ADMIN_EMAILS is unset', () => {
    delete process.env.ADMIN_EMAILS
    expect(isAdminEmail('anyone@example.com')).toBe(false)
  })

  it('returns false for a null or undefined email', () => {
    process.env.ADMIN_EMAILS = 'boss@example.com'
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
  })

  it('returns true for an exact match', () => {
    process.env.ADMIN_EMAILS = 'boss@example.com'
    expect(isAdminEmail('boss@example.com')).toBe(true)
  })

  it('is case-insensitive', () => {
    process.env.ADMIN_EMAILS = 'Boss@Example.com'
    expect(isAdminEmail('boss@example.com')).toBe(true)
  })

  it('supports multiple comma-separated emails with surrounding whitespace', () => {
    process.env.ADMIN_EMAILS = ' boss@example.com, second@example.com '
    expect(isAdminEmail('second@example.com')).toBe(true)
  })

  it('returns false for an email not in the list', () => {
    process.env.ADMIN_EMAILS = 'boss@example.com'
    expect(isAdminEmail('random@example.com')).toBe(false)
  })
})
