import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProfileEditForm from '@/app/profile/ProfileEditForm'

jest.mock('country-state-city', () => ({
  Country: {
    getAllCountries: jest.fn(() => [
      { isoCode: 'IN', name: 'India' },
      { isoCode: 'US', name: 'United States' },
    ]),
    getCountryByCode: jest.fn((code: string) =>
      code === 'IN' ? { name: 'India' } : code === 'US' ? { name: 'United States' } : null
    ),
  },
  State: {
    getStatesOfCountry: jest.fn((code: string) =>
      code === 'IN' ? [{ isoCode: 'TG', name: 'Telangana' }] : []
    ),
    getStateByCodeAndCountry: jest.fn((stateCode: string, countryCode: string) =>
      stateCode === 'TG' && countryCode === 'IN' ? { name: 'Telangana' } : null
    ),
  },
  City: {
    getCitiesOfState: jest.fn((countryCode: string, stateCode: string) =>
      countryCode === 'IN' && stateCode === 'TG'
        ? [{ name: 'Hyderabad' }]
        : []
    ),
  },
}))

global.fetch = jest.fn()
const mockFetch = fetch as jest.Mock

const defaultProps = {
  initialValues: {
    full_name: 'Jane Doe',
    email: 'jane@example.com',
    country: 'India',
    state_region: 'Telangana',
    city: 'Hyderabad',
    years_of_experience: '5-10 years',
    designation: 'Tech',
    linkedin_url: '',
    company_name: 'AcmeTeam',
  },
}

describe('ProfileEditForm', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders read-only name and email', () => {
    render(<ProfileEditForm {...defaultProps} />)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('renders Tech / Non-Tech as a dropdown', () => {
    render(<ProfileEditForm {...defaultProps} />)
    const select = screen.getByLabelText('Tech or Non-Tech') as HTMLSelectElement
    expect(select.tagName).toBe('SELECT')
  })

  it('renders the optional company/team name and sanitizes edits', () => {
    render(<ProfileEditForm {...defaultProps} />)
    const companyName = screen.getByLabelText(/Company Name \/ Team Name/i) as HTMLInputElement
    expect(companyName.value).toBe('AcmeTeam')
    expect(companyName).not.toBeRequired()
    fireEvent.change(companyName, { target: { value: 'New Team!_42' } })
    expect(companyName.value).toBe('NewTeam42')
  })

  it('pre-selects the background from initialValues when it matches an option', () => {
    render(<ProfileEditForm {...defaultProps} />)
    const select = screen.getByLabelText('Tech or Non-Tech') as HTMLSelectElement
    expect(select.value).toBe('Tech')
  })

  it('shows empty selection when initialValues designation does not match any option', () => {
    render(<ProfileEditForm {...defaultProps} initialValues={{ ...defaultProps.initialValues, designation: 'Custom Old Value' }} />)
    const select = screen.getByLabelText('Tech or Non-Tech') as HTMLSelectElement
    expect(select.value).toBe('')
  })

  it('renders only Tech and Non-Tech plus the placeholder', () => {
    render(<ProfileEditForm {...defaultProps} />)
    const select = screen.getByLabelText('Tech or Non-Tech') as HTMLSelectElement
    const options = Array.from(select.options).map((o) => o.value)
    expect(options).toEqual(['', 'Tech', 'Non-Tech'])
  })

  it('updates background when the user selects a new option', () => {
    render(<ProfileEditForm {...defaultProps} />)
    const select = screen.getByLabelText('Tech or Non-Tech') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'Non-Tech' } })
    expect(select.value).toBe('Non-Tech')
  })

  it('stores the selected background in the existing designation field', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    render(<ProfileEditForm {...defaultProps} />)
    fireEvent.change(screen.getByLabelText('Tech or Non-Tech'), { target: { value: 'Non-Tech' } })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      const [, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body)
      expect(body.designation).toBe('Non-Tech')
      expect(body.company_name).toBe('AcmeTeam')
    })
  })

  it('shows "Profile saved successfully!" after successful save', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    render(<ProfileEditForm {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText('Profile saved successfully!')).toBeInTheDocument()
    })
  })

  it('shows error message when API returns error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to update profile' }),
    })
    render(<ProfileEditForm {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText('Failed to update profile')).toBeInTheDocument()
    })
  })
})
