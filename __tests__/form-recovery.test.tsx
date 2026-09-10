import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import LoginPage from '@/app/login/page'
import SignupPage from '@/app/signup/page'
import HomeSignupForm from '@/components/HomeSignupForm'
import CompleteProfilePage from '@/app/profile/complete/page'
import ProfileEditForm from '@/app/profile/ProfileEditForm'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}))
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))
jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }))

const mockSignIn = signIn as jest.Mock
const mockUseRouter = useRouter as jest.Mock
const mockFetch = jest.fn()
const push = jest.fn()

beforeEach(() => {
  jest.resetAllMocks()
  global.fetch = mockFetch
  mockUseRouter.mockReturnValue({ push })
})

function fillSignup() {
  fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'QA' } })
  fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Tester' } })
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'qa@example.com' } })
  fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: 'test-password-only' } })
}

describe.each([
  ['signup page', SignupPage],
  ['landing signup', HomeSignupForm],
] as const)('%s recovery', (_name, Component) => {
  it.each(['offline', 'invalid-json'])('restores the submit button after %s', async (failure) => {
    if (failure === 'offline') mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    else mockFetch.mockResolvedValueOnce({ ok: false, json: async () => { throw new SyntaxError('Invalid JSON') } })
    render(<Component />)
    fillSignup()
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/try again/i))
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeEnabled()
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('opens login when account creation succeeds but automatic sign-in throws', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    mockSignIn.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    render(<Component />)
    fillSignup()
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'))
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('announces Google sign-in failure without an unhandled rejection', async () => {
    mockSignIn.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    render(<Component />)
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/try again/i))
  })
})

it('recovers from a failed credentials login request', async () => {
  mockSignIn.mockRejectedValueOnce(new TypeError('Failed to fetch'))
  render(<LoginPage />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'qa@example.com' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'test-password-only' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in', exact: true }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/try again/i))
  expect(screen.getByRole('button', { name: 'Sign in', exact: true })).toBeEnabled()
  expect(push).not.toHaveBeenCalled()
})

it('recovers from a failed Google login request', async () => {
  mockSignIn.mockRejectedValueOnce(new TypeError('Failed to fetch'))
  render(<LoginPage />)
  fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/try again/i))
})

it('restores profile completion after a network failure', async () => {
  mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
  render(<CompleteProfilePage />)
  fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Hyderabad' } })
  fireEvent.click(screen.getByLabelText('1-3 years'))
  fireEvent.click(screen.getByLabelText('Tech'))
  fireEvent.click(screen.getByRole('button', { name: /continue/i }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/try again/i))
  expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
  expect(screen.getByLabelText('City')).toHaveValue('Hyderabad')
  expect(push).not.toHaveBeenCalled()
})

it('restores profile editing after a network failure', async () => {
  mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
  render(<ProfileEditForm initialValues={{ full_name: 'QA Tester', email: 'qa@example.com', country: 'India', state_region: 'Telangana', city: 'Hyderabad', years_of_experience: '1-3 years', designation: 'Tech', linkedin_url: '' }} />)
  fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/try again/i))
  expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

it('labels all landing signup inputs for assistive technology', () => {
  render(<HomeSignupForm />)
  for (const label of ['First Name', 'Last Name', 'Email', 'Password']) {
    expect(screen.getByLabelText(label)).toBeInTheDocument()
  }
})

it('provides a visible logout action during onboarding', () => {
  render(<CompleteProfilePage />)
  expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
})
