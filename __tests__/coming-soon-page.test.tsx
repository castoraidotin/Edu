import { render, screen } from '@testing-library/react'
import ComingSoonPage from '@/app/coming-soon/page'
import { getProductAccessState } from '@/lib/product-access-server'

jest.mock('@/components/Logo', () => ({ __esModule: true, default: () => <div>Edu</div> }))
jest.mock('@/lib/product-access-server', () => ({ getProductAccessState: jest.fn() }))
jest.mock('next/navigation', () => ({ redirect: jest.fn() }))

const mockGetProductAccessState = getProductAccessState as jest.Mock

describe('ComingSoonPage', () => {
  it('renders a lightweight waitlist confirmation without disclosing the launch city', async () => {
    mockGetProductAccessState.mockResolvedValue({
      status: 'coming-soon',
      session: { user: { email: 'test@example.com' } },
      profile: {
        profile_completed: false,
        country: 'India',
        state_region: 'Telangana',
        city: 'Warangal',
      },
    })

    render(await ComingSoonPage())
    expect(screen.queryByText('Access expanding')).not.toBeInTheDocument()
    expect(screen.queryByText(/waitlist/i)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Coming soon to your city.' })).toBeInTheDocument()
    expect(screen.getByText("We're expanding to more cities. Check back soon.")).toBeInTheDocument()
    expect(screen.queryByText(/we.?ll notify you/i)).not.toBeInTheDocument()
    expect(screen.getByText('Warangal, Telangana')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/?from=coming-soon')
    expect(screen.queryByText(/Hyderabad/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/launch coverage/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/keep every benchmark useful/i)).not.toBeInTheDocument()
  })
})
