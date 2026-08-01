import { render, screen, fireEvent } from '@testing-library/react'
import UserMenu from '@/components/UserMenu'

const mockSignOut = jest.fn()
const mockPush = jest.fn()

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: { name: 'Shanthan Kumar', email: 'shanthan@example.com' },
    },
  })),
  signOut: (opts: unknown) => mockSignOut(opts),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}))

describe('UserMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the avatar trigger button', () => {
    render(<UserMenu />)
    expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument()
  })

  it('does not show dropdown initially', () => {
    render(<UserMenu />)
    expect(screen.queryByTestId('user-dropdown')).not.toBeInTheDocument()
  })

  it('opens dropdown when avatar button is clicked', () => {
    render(<UserMenu />)
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }))
    expect(screen.getByTestId('user-dropdown')).toBeInTheDocument()
  })

  it('shows user name and email in dropdown', () => {
    render(<UserMenu />)
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }))
    expect(screen.getByText('Shanthan Kumar')).toBeInTheDocument()
    expect(screen.getByText('shanthan@example.com')).toBeInTheDocument()
  })

  it('shows Profile, Stats and Sign out buttons in dropdown', () => {
    render(<UserMenu />)
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }))
    expect(screen.getByRole('button', { name: /^profile$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^stats$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('shows Castor AI as the organization', () => {
    render(<UserMenu />)
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }))
    expect(screen.getByText('Castor AI')).toBeInTheDocument()
    expect(screen.getByText('Organization')).toBeInTheDocument()
  })

  it('shows the two Castor AI service workspaces', () => {
    render(<UserMenu />)
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }))
    fireEvent.click(screen.getByText('Castor AI'))
    expect(screen.getByRole('menuitem', { name: /AI Workforce Training/i })).toHaveAttribute('href', 'https://www.castorai.in/contact')
    expect(screen.getByRole('menuitem', { name: /Software Solutions/i })).toHaveAttribute('href', 'https://www.castorai.in/contact')
  })

  it('navigates to /profile when Profile is clicked', () => {
    render(<UserMenu />)
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }))
    fireEvent.click(screen.getByRole('button', { name: /^profile$/i }))
    expect(mockPush).toHaveBeenCalledWith('/profile')
  })

  it('navigates to /stats when Stats is clicked', () => {
    render(<UserMenu />)
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }))
    fireEvent.click(screen.getByRole('button', { name: /^stats$/i }))
    expect(mockPush).toHaveBeenCalledWith('/stats')
  })

  it('calls signOut with / callbackUrl when Sign out is clicked', () => {
    render(<UserMenu />)
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }))
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
  })

  it('closes dropdown when Profile is clicked', () => {
    render(<UserMenu />)
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }))
    fireEvent.click(screen.getByRole('button', { name: /^profile$/i }))
    expect(screen.queryByTestId('user-dropdown')).not.toBeInTheDocument()
  })

  it('closes dropdown on second click of avatar button', () => {
    render(<UserMenu />)
    const btn = screen.getByRole('button', { name: /user menu/i })
    fireEvent.click(btn)
    expect(screen.getByTestId('user-dropdown')).toBeInTheDocument()
    fireEvent.click(btn)
    expect(screen.queryByTestId('user-dropdown')).not.toBeInTheDocument()
  })
})
