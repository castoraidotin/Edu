export const COMPANY_NAME_MAX_LENGTH = 100
export const COMPANY_NAME_PATTERN = /^[A-Za-z0-9]+$/

export function sanitizeCompanyName(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').slice(0, COMPANY_NAME_MAX_LENGTH)
}

export function getCompanyNameError(value: unknown): string | null {
  if (value === undefined || value === '') return null
  if (typeof value !== 'string') {
    return 'Company Name / Team Name must be text'
  }

  const companyName = value

  if (companyName.length > COMPANY_NAME_MAX_LENGTH) {
    return `Company Name / Team Name must be ${COMPANY_NAME_MAX_LENGTH} characters or fewer`
  }
  if (!COMPANY_NAME_PATTERN.test(companyName)) {
    return 'Company Name / Team Name can only contain letters and numbers'
  }

  return null
}
