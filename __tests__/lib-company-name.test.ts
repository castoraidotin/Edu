import {
  COMPANY_NAME_MAX_LENGTH,
  getCompanyNameError,
  sanitizeCompanyName,
} from '@/lib/company-name'

describe('company name validation', () => {
  it('allows an omitted or empty optional value', () => {
    expect(getCompanyNameError(undefined)).toBeNull()
    expect(getCompanyNameError('')).toBeNull()
  })

  it('allows letters and numbers', () => {
    expect(getCompanyNameError('AcmeTeam42')).toBeNull()
  })

  it('rejects non-text values from an API payload', () => {
    expect(getCompanyNameError(42)).toMatch(/must be text/)
    expect(getCompanyNameError(null)).toMatch(/must be text/)
  })

  it('rejects spaces and special characters', () => {
    expect(getCompanyNameError('Acme Team')).toMatch(/letters and numbers/)
    expect(getCompanyNameError('Acme-Team')).toMatch(/letters and numbers/)
    expect(getCompanyNameError('   ')).toMatch(/letters and numbers/)
  })

  it('rejects values over the maximum length', () => {
    expect(getCompanyNameError('a'.repeat(COMPANY_NAME_MAX_LENGTH + 1))).toMatch(/100 characters/)
  })

  it('removes invalid characters and caps browser input length', () => {
    expect(sanitizeCompanyName('Acme Team!_42')).toBe('AcmeTeam42')
    expect(sanitizeCompanyName('a'.repeat(101))).toHaveLength(COMPANY_NAME_MAX_LENGTH)
  })
})
