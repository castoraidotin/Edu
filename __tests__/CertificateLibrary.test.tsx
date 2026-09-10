import { fireEvent, render, screen } from '@testing-library/react'
import CertificateLibrary from '@/components/certificates/CertificateLibrary'

jest.mock('@/components/CompletionCertificate', () => ({
  __esModule: true,
  default: ({ score, attemptId }: { score: number; attemptId: string }) => (
    <div data-testid="saved-certificate">{attemptId}:{score}</div>
  ),
}))

describe('CertificateLibrary', () => {
  it('shows only the selected domain certificate', () => {
    render(
      <CertificateLibrary
        recipientName="Test Learner"
        items={[
          {
            domain: 'ai',
            label: 'Artificial Intelligence & Generative AI',
            description: 'AI certificate',
            assessmentHref: '/test/ai',
            certificate: {
              attemptId: 'ai-attempt',
              score: 6,
              completedAt: '2026-08-01T10:00:00.000Z',
            },
          },
          {
            domain: 'cloud',
            label: 'Cloud Computing',
            description: 'Cloud certificate',
            assessmentHref: '/test/cloud',
            certificate: {
              attemptId: 'cloud-attempt',
              score: 9,
              completedAt: '2026-08-02T10:00:00.000Z',
            },
          },
        ]}
      />,
    )

    expect(screen.getByTestId('saved-certificate')).toHaveTextContent('ai-attempt:6')
    expect(screen.queryByText('cloud-attempt:9')).not.toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox', { name: 'Certificate domain' }), {
      target: { value: 'cloud' },
    })

    expect(screen.getByRole('heading', { name: 'Cloud Computing' })).toBeInTheDocument()
    expect(screen.getByTestId('saved-certificate')).toHaveTextContent('cloud-attempt:9')
    expect(screen.queryByText('ai-attempt:6')).not.toBeInTheDocument()
  })
})
