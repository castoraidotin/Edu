import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CompleteProfilePage from '@/app/profile/complete/page'
import { useRouter } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { name: 'Test User', email: 'test@test.com' } },
  })),
}))

jest.mock('country-state-city', () => ({
  Country: {
    getCountryByCode: jest.fn((code: string) => code === 'IN' ? { name: 'India' } : null),
  },
  State: {
    getStatesOfCountry: jest.fn(() => [{ isoCode: 'TG', name: 'Telangana' }]),
    getStateByCodeAndCountry: jest.fn(() => ({ name: 'Telangana' })),
  },
  City: {
    getCitiesOfState: jest.fn(() => [{ name: 'Hyderabad' }, { name: 'Warangal' }]),
  },
}))

const mockUseRouter = useRouter as jest.Mock
global.fetch = jest.fn()
const mockFetch = fetch as jest.Mock

function chooseLocation(city = 'Hyderabad') {
  fireEvent.change(screen.getByLabelText('State or Region'), { target: { value: 'TG' } })
  fireEvent.change(screen.getByLabelText('City'), { target: { value: city } })
}

async function confirmEligibleLocation() {
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ available: true }) })
  chooseLocation()
  fireEvent.click(screen.getByRole('button', { name: /check availability/i }))
  await waitFor(() => expect(screen.getByLabelText('Designation')).toBeInTheDocument())
}

describe('CompleteProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ push: jest.fn() })
  })

  it('asks only for state and city before checking availability', () => {
    render(<CompleteProfilePage />)
    expect(screen.getByLabelText('State or Region')).toBeInTheDocument()
    expect(screen.getByLabelText('City')).toBeInTheDocument()
    expect(screen.queryByLabelText('Country')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Designation')).not.toBeInTheDocument()
    expect(screen.queryByText('Years of Experience')).not.toBeInTheDocument()
  })

  it('keeps availability check disabled until both location fields are selected', () => {
    render(<CompleteProfilePage />)
    const button = screen.getByRole('button', { name: /check availability/i })
    expect(button).toBeDisabled()
    chooseLocation()
    expect(button).toBeEnabled()
  })

  it('saves the location and sends unavailable cities directly to the waitlist', async () => {
    const push = jest.fn()
    mockUseRouter.mockReturnValue({ push })
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ available: false }) })
    render(<CompleteProfilePage />)
    chooseLocation('Warangal')
    fireEvent.click(screen.getByRole('button', { name: /check availability/i }))

    await waitFor(() => expect(push).toHaveBeenCalledWith('/coming-soon'))
    expect(mockFetch).toHaveBeenCalledWith('/api/profile/location', expect.objectContaining({ method: 'PATCH' }))
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body).toEqual({ state_region: 'Telangana', city: 'Warangal' })
  })

  it('reveals professional details only after an eligible location is confirmed', async () => {
    render(<CompleteProfilePage />)
    await confirmEligibleLocation()
    expect(screen.getByText('Years of Experience')).toBeInTheDocument()
    expect(screen.getByLabelText('Designation')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://linkedin.com/in/yourname')).toBeInTheDocument()
    expect(screen.getByTestId('progress-percent')).toHaveTextContent('60%')
  })

  it('submits the complete profile and opens the dashboard for an eligible user', async () => {
    const push = jest.fn()
    mockUseRouter.mockReturnValue({ push })
    render(<CompleteProfilePage />)
    await confirmEligibleLocation()
    fireEvent.click(screen.getByLabelText('1-3 years'))
    fireEvent.change(screen.getByLabelText('Designation'), { target: { value: 'Data Scientist' } })
    expect(screen.getByTestId('progress-percent')).toHaveTextContent('100%')

    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'))

    const body = JSON.parse(mockFetch.mock.calls[1][1].body)
    expect(body).toEqual(expect.objectContaining({
      country: 'India',
      state_region: 'Telangana',
      city: 'Hyderabad',
      years_of_experience: '1-3 years',
      designation: 'Data Scientist',
    }))
  })

  it('shows a location-check error without revealing professional fields', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Could not save location' }) })
    render(<CompleteProfilePage />)
    chooseLocation()
    fireEvent.click(screen.getByRole('button', { name: /check availability/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Could not save location'))
    expect(screen.queryByLabelText('Designation')).not.toBeInTheDocument()
  })
})
