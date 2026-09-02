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

const mockUseRouter = useRouter as jest.Mock
global.fetch = jest.fn()
const mockFetch = fetch as jest.Mock

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Hyderabad' } })
  fireEvent.click(screen.getByLabelText('1-3 years'))
  fireEvent.click(screen.getByLabelText('Tech'))
}

describe('CompleteProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ push: jest.fn() })
  })

  it('shows the full profile form immediately with city as the only location field', () => {
    render(<CompleteProfilePage />)
    expect(screen.getByLabelText('City')).toBeInTheDocument()
    expect(screen.queryByLabelText('Country')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('State or Region')).not.toBeInTheDocument()
    expect(screen.getByText('Years of Experience')).toBeInTheDocument()
    expect(screen.getByText('Are you Tech or Non-Tech?')).toBeInTheDocument()
    expect(screen.getByLabelText('Tech')).toBeInTheDocument()
    expect(screen.getByLabelText('Non-Tech')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://linkedin.com/in/yourname')).toBeInTheDocument()
  })

  it('shows all five cities but enables only Hyderabad', () => {
    render(<CompleteProfilePage />)
    const select = screen.getByLabelText('City') as HTMLSelectElement
    const options = Array.from(select.options).slice(1)

    expect(options.map((option) => option.textContent)).toEqual([
      'Hyderabad',
      'Bangalore',
      'Chennai',
      'Delhi',
      'Mumbai',
    ])
    expect(options.find((option) => option.value === 'Hyderabad')).not.toBeDisabled()
    for (const city of ['Bangalore', 'Chennai', 'Delhi', 'Mumbai']) {
      const option = options.find((item) => item.value === city)
      expect(option).toBeDisabled()
      expect(option).toHaveStyle({ color: '#9ca3af' })
    }
  })

  it('keeps Continue disabled until city, experience, and background are selected', () => {
    render(<CompleteProfilePage />)
    const button = screen.getByRole('button', { name: /continue/i })
    expect(button).toBeDisabled()
    fillRequiredFields()
    expect(button).toBeEnabled()
  })

  it('updates profile progress as required fields are completed', () => {
    render(<CompleteProfilePage />)
    expect(screen.getByTestId('progress-percent')).toHaveTextContent('40%')
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Hyderabad' } })
    expect(screen.getByTestId('progress-percent')).toHaveTextContent('60%')
    fireEvent.click(screen.getByLabelText('1-3 years'))
    fireEvent.click(screen.getByLabelText('Tech'))
    expect(screen.getByTestId('progress-percent')).toHaveTextContent('100%')
  })

  it('submits Hyderabad with its derived country and state, then opens the dashboard', async () => {
    const push = jest.fn()
    mockUseRouter.mockReturnValue({ push })
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })

    render(<CompleteProfilePage />)
    fillRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'))
    expect(mockFetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({ method: 'PATCH' }))
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body).toEqual(expect.objectContaining({
      country: 'India',
      state_region: 'Telangana',
      city: 'Hyderabad',
      years_of_experience: '1-3 years',
      designation: 'Tech',
    }))
  })

  it('shows a profile-save error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Could not save profile' }),
    })
    render(<CompleteProfilePage />)
    fillRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Could not save profile'))
  })

  it('shows a loading state while saving', async () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}))
    render(<CompleteProfilePage />)
    fillRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => expect(screen.getByText('Saving...')).toBeInTheDocument())
  })
})
