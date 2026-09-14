import { render, screen } from '@testing-library/react'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href as string} {...props}>{children}</a>
  ),
}))
jest.mock('@/components/Logo', () => ({ __esModule: true, default: () => <span>Edu logo</span> }))

import PrivacyPage from '@/app/privacy/page'
import TermsPage from '@/app/terms/page'

describe('Public legal pages', () => {
  it('explains the data Edu collects and provides a privacy contact', () => {
    render(<PrivacyPage />)

    expect(screen.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/Assessment information:/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'support@castorai.in' })).toHaveAttribute(
      'href',
      'mailto:support@castorai.in'
    )
  })

  it('publishes the service rules and assessment disclaimer', () => {
    render(<TermsPage />)

    expect(screen.getByRole('heading', { name: 'Terms of Service', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/informational benchmarks/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
  })
})
