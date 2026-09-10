import { render, screen, fireEvent } from '@testing-library/react'
import DomainSelector from '@/components/DomainSelector'
import { useRouter } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}))

const mockUseRouter = useRouter as jest.Mock

describe('DomainSelector', () => {
  it('renders all 5 domains', () => {
    render(<DomainSelector />)
    expect(screen.getByText('Artificial Intelligence & Generative AI')).toBeInTheDocument()
    expect(screen.getByText('Cloud Computing')).toBeInTheDocument()
    expect(screen.getByText('Cybersecurity')).toBeInTheDocument()
    expect(screen.getByText('DevOps & CI/CD')).toBeInTheDocument()
    expect(screen.getByText('Data Science, Analytics & Big Data')).toBeInTheDocument()
    expect(screen.getAllByText('Coming soon')).toHaveLength(4)
  })

  it('keeps coming-soon domains visible but non-interactive', () => {
    render(<DomainSelector />)
    expect(screen.getByTestId('coming-soon-cloud')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.queryByRole('button', { name: 'Select Cloud Computing assessment' })).not.toBeInTheDocument()
  })

  it('shows confirmation modal when the available domain is selected', () => {
    render(<DomainSelector />)
    fireEvent.click(screen.getByRole('button', { name: 'Select Artificial Intelligence & Generative AI assessment' }))
    expect(screen.getByText('Ready to start?')).toBeInTheDocument()
    expect(screen.getByText('10 questions · 5 minute timer · Cannot pause')).toBeInTheDocument()
  })

  it('closes modal when Cancel is clicked', () => {
    render(<DomainSelector />)
    fireEvent.click(screen.getByRole('button', { name: 'Select Artificial Intelligence & Generative AI assessment' }))
    expect(screen.getByText('Ready to start?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Ready to start?')).not.toBeInTheDocument()
  })

  it('navigates to test page when Start Test is clicked', () => {
    const push = jest.fn()
    mockUseRouter.mockReturnValue({ push })
    render(<DomainSelector />)
    fireEvent.click(screen.getByRole('button', { name: 'Select Artificial Intelligence & Generative AI assessment' }))
    fireEvent.click(screen.getByText('Start Test'))
    expect(push).toHaveBeenCalledWith('/test/ai')
  })
})
