import { render, screen, fireEvent } from '@testing-library/react'
import ResultsScreen from '@/components/ResultsScreen'
import type { Domain } from '@/lib/types'

// next/navigation is mocked because the "Dashboard" button pushes via
// useRouter. The push spy is asserted below.
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))
jest.mock('@vercel/analytics', () => ({ track: jest.fn() }))

import { useRouter } from 'next/navigation'
import { track } from '@vercel/analytics'
const mockUseRouter = useRouter as jest.Mock
const mockTrack = track as jest.Mock

describe('ResultsScreen', () => {
  const push = jest.fn()
  const onTryAgain = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ push })
  })

  it('shows the score, domain label, and score tier for an average result', () => {
    render(<ResultsScreen domain="ai" score={6} onTryAgain={onTryAgain} />)

    expect(screen.getByText('Your benchmark')).toBeInTheDocument()
    expect(screen.getAllByText('Artificial Intelligence & Generative AI')).not.toHaveLength(0)
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('Average')).toBeInTheDocument()
  })

  it('picks the right tier label at each score band', () => {
    const cases: { score: number; label: string }[] = [
      { score: 10, label: 'Excellent' },
      { score: 9, label: 'Excellent' },
      { score: 8, label: 'Good' },
      { score: 7, label: 'Good' },
      { score: 6, label: 'Average' },
      { score: 5, label: 'Average' },
      { score: 4, label: 'Needs improvement' },
      { score: 0, label: 'Needs improvement' },
    ]
    for (const { score, label } of cases) {
      const { unmount } = render(
        <ResultsScreen domain="ai" score={score} onTryAgain={onTryAgain} />
      )
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    }
  })

  describe('domain-based CTA routing', () => {
    it('shows the training CTA button for AI domain', () => {
      render(<ResultsScreen domain="ai" score={7} onTryAgain={onTryAgain} />)
      expect(screen.getByRole('link', { name: /See training programs/i })).toBeInTheDocument()
    })

    it('shows the training CTA button for Data Science domain', () => {
      render(<ResultsScreen domain="data_science" score={7} onTryAgain={onTryAgain} />)
      expect(screen.getByRole('link', { name: /See training programs/i })).toBeInTheDocument()
    })

    it('shows the automation CTA button for every ops-heavy domain', () => {
      const opsDomains: Domain[] = ['cloud', 'devops', 'cybersecurity']
      for (const domain of opsDomains) {
        const { unmount } = render(
          <ResultsScreen domain={domain} score={7} onTryAgain={onTryAgain} />
        )
        expect(
          screen.getByRole('link', { name: /See automation solutions/i })
        ).toBeInTheDocument()
        unmount()
      }
    })
  })

  describe('tier-aware pitch copy', () => {
    // Pitch line changes with the score so a high scorer doesn't get told
    // to "close this gap" after being told they're ahead of most peers.
    // Pitch is score-only (not domain-tied), so the button below carries
    // the domain routing on its own — the two concerns stay cleanly split.
    // Each snippet is unique to its tier so tests can fingerprint it
    // without hard-coding the whole sentence.
    const tierFingerprints: Record<number, RegExp> = {
      10: /bring your whole team to this level/i,
      8: /take the next step with castor ai/i,
      // Average and Needs improvement deliberately share a pitch — the
      // "close this gap with hands-on AI training" line lands the same way
      // for both bands, so we don't split them.
      6: /close this gap with hands-on AI training/i,
      3: /close this gap with hands-on AI training/i,
    }

    it('renders the tier-specific pitch for each score band', () => {
      for (const [score, pattern] of Object.entries(tierFingerprints)) {
        const { unmount } = render(
          <ResultsScreen domain="ai" score={Number(score)} onTryAgain={onTryAgain} />
        )
        expect(screen.getByText(pattern)).toBeInTheDocument()
        unmount()
      }
    })

    it('uses the same pitch line regardless of domain, for a given score', () => {
      // Domain drives the button destination, not the pitch — so an AI
      // quiz and a DevOps quiz at the same score must produce the same
      // pitch line. Pins the "pitch is score-only" contract so a future
      // edit re-tying it to domain will fail loudly.
      const domains: Domain[] = ['ai', 'data_science', 'cloud', 'devops', 'cybersecurity']
      for (const domain of domains) {
        const { unmount } = render(
          <ResultsScreen domain={domain} score={10} onTryAgain={onTryAgain} />
        )
        expect(screen.getByText(/bring your whole team to this level/i)).toBeInTheDocument()
        unmount()
      }
    })

    it('does NOT show the "close this gap" line to a high scorer', () => {
      // Regression pin: the original single-pitch copy told excellent
      // scorers to close a gap that didn't exist, which read as patronizing
      // and hurt trust with senior engineers. Never do that again.
      render(<ResultsScreen domain="ai" score={10} onTryAgain={onTryAgain} />)
      expect(screen.queryByText(/close this gap/i)).not.toBeInTheDocument()
    })
  })

  describe('Castor CTA link', () => {
    it('opens in a new tab with noopener rel and utm-tagged url', () => {
      render(<ResultsScreen domain="devops" score={5} onTryAgain={onTryAgain} />)
      const cta = screen.getByTestId('results-castor-cta') as HTMLAnchorElement
      expect(cta).toHaveAttribute('target', '_blank')
      expect(cta.rel).toContain('noopener')
      expect(cta.rel).toContain('noreferrer')
      const href = new URL(cta.href)
      expect(href.hostname).toBe('castorai.in')
      expect(href.searchParams.get('utm_source')).toBe('edu')
      expect(href.searchParams.get('utm_medium')).toBe('quiz_results')
      // utm_content carries variant + domain so results-screen conversions
      // can be split by which domain/CTA drove the click.
      expect(href.searchParams.get('utm_content')).toBe('automation_devops')
    })

    // Regression: this is the only Castor CTA surface left once the mid-quiz
    // ad slide/interstitial/badge are disabled (see lib/promo.ts). Before
    // this test existed, clicking it fired no analytics event at all — CTA
    // click data would have silently gone to zero the moment this PR shipped.
    it('fires a cta_clicked analytics event on click, tagged with location, variant, and domain', () => {
      render(<ResultsScreen domain="devops" score={5} onTryAgain={onTryAgain} />)
      fireEvent.click(screen.getByTestId('results-castor-cta'))
      expect(mockTrack).toHaveBeenCalledWith('cta_clicked', {
        location: 'quiz_results',
        brand: 'castor',
        variant: 'automation',
        domain: 'devops',
      })
    })

    it('tags the training variant for a training-routed domain', () => {
      render(<ResultsScreen domain="ai" score={5} onTryAgain={onTryAgain} />)
      fireEvent.click(screen.getByTestId('results-castor-cta'))
      expect(mockTrack).toHaveBeenCalledWith('cta_clicked', {
        location: 'quiz_results',
        brand: 'castor',
        variant: 'training',
        domain: 'ai',
      })
    })
  })

  describe('AI completion certificate', () => {
    it('shows a personalized certificate after an AI assessment', () => {
      render(
        <ResultsScreen
          domain="ai"
          score={8}
          recipientName="Shanthan Kumar"
          certificate={{
            attemptId: '12345678-abcd-efgh',
            score: 8,
            completedAt: '2026-08-26T12:00:00.000Z',
            topPercent: 10,
            city: 'Hyderabad',
          }}
          onTryAgain={onTryAgain}
        />
      )

      const certificate = screen.getByTestId('ai-completion-certificate')
      const scrollPrompt = screen.getByRole('link', { name: /Scroll down to view your certificate\./i })
      expect(scrollPrompt).toHaveAttribute('href', '#completion-certificate')
      expect(scrollPrompt).toHaveClass('fixed', 'right-4', 'top-4', 'z-50')
      expect(certificate).toHaveTextContent('Your certificate is ready')
      expect(
        screen.getByRole('heading', { name: 'Your benchmark' }).compareDocumentPosition(certificate) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(certificate).toHaveTextContent('Shanthan Kumar')
      expect(certificate).toHaveTextContent('EDU-AI-12345678AB')
      expect(certificate).toHaveTextContent(/ranking among the top 10% of all test-takers\./i)
      expect(screen.getByRole('button', { name: /Share certificate/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Download PNG/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Share on LinkedIn/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Share on Twitter\/X/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Share on Facebook/i })).toBeInTheDocument()
    })

    it('does not show the certificate after a non-AI assessment', () => {
      render(<ResultsScreen domain="cloud" score={8} onTryAgain={onTryAgain} />)
      expect(screen.queryByTestId('ai-completion-certificate')).not.toBeInTheDocument()
    })

    it('keeps scores off the shareable certificate after an AI retake', () => {
      render(
        <ResultsScreen
          domain="ai"
          score={10}
          recipientName="Shanthan Kumar"
          certificate={{
            attemptId: '12345678-abcd-efgh',
            score: 6,
            completedAt: '2026-08-26T12:00:00.000Z',
            topPercent: 25,
            city: 'Hyderabad',
          }}
          onTryAgain={onTryAgain}
        />
      )

      expect(screen.getByRole('heading', { name: 'Your benchmark' }).parentElement).toHaveTextContent('10 / 10')
      const certificate = screen.getByTestId('ai-completion-certificate')
      expect(certificate).toHaveTextContent(/ranking among the top 25% of all test-takers\./i)
      expect(certificate).not.toHaveTextContent('6/10')
      expect(certificate).not.toHaveTextContent('10/10')
    })

    it('does not mint a certificate client-side without an issued first-attempt record', () => {
      render(<ResultsScreen domain="ai" score={8} onTryAgain={onTryAgain} />)
      expect(screen.queryByTestId('ai-completion-certificate')).not.toBeInTheDocument()
      expect(screen.queryByText('Scroll down to view your certificate.')).not.toBeInTheDocument()
    })
  })

  describe('secondary actions', () => {
    it('calls onTryAgain when the Try again button is clicked', () => {
      render(<ResultsScreen domain="ai" score={4} onTryAgain={onTryAgain} />)
      fireEvent.click(screen.getByRole('button', { name: /Try again/i }))
      expect(onTryAgain).toHaveBeenCalledTimes(1)
    })

    it('routes to the dashboard when Dashboard is clicked', () => {
      render(<ResultsScreen domain="ai" score={4} onTryAgain={onTryAgain} />)
      fireEvent.click(screen.getByRole('button', { name: /Dashboard/i }))
      expect(push).toHaveBeenCalledWith('/dashboard')
    })

    it('places a highlighted Insights action after Dashboard and routes to the selected domain', () => {
      render(<ResultsScreen domain="ai" score={4} onTryAgain={onTryAgain} />)

      const dashboard = screen.getByRole('button', { name: /Dashboard/i })
      const insights = screen.getByRole('button', { name: /Insights/i })
      expect(dashboard.compareDocumentPosition(insights) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(insights).toHaveClass('results-insights-button')

      fireEvent.click(insights)
      expect(push).toHaveBeenCalledWith('/stats?domain=ai')
    })
  })
})
