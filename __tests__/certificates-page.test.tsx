import { render, screen } from '@testing-library/react'
import CertificatesPage from '@/app/certificates/page'
import { getFirstCertificateForUser } from '@/lib/certificate-data'
import { requireProductAccess } from '@/lib/product-access-server'

jest.mock('@/lib/product-access-server', () => ({ requireProductAccess: jest.fn() }))
jest.mock('@/lib/certificate-data', () => ({ getFirstCertificateForUser: jest.fn() }))
jest.mock('@/components/dashboard/DashboardShell', () => ({
  __esModule: true,
  default: ({ children, activePath }: { children: React.ReactNode; activePath: string }) => (
    <div data-testid="dashboard-shell" data-active-path={activePath}>{children}</div>
  ),
}))
jest.mock('@/components/CompletionCertificate', () => ({
  __esModule: true,
  default: ({ score, attemptId }: { score: number; attemptId: string }) => (
    <div data-testid="saved-certificate">{attemptId}:{score}</div>
  ),
}))

const mockRequireProductAccess = requireProductAccess as jest.Mock
const mockGetFirstCertificate = getFirstCertificateForUser as jest.Mock

describe('CertificatesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireProductAccess.mockResolvedValue({
      session: { user: { name: 'Test Learner', email: 'learner@example.com' } },
    })
  })

  it('shows the saved first-attempt certificate in the Certificates tab', async () => {
    mockGetFirstCertificate.mockResolvedValue({
      attemptId: '11111111-1111-4111-8111-111111111111',
      score: 4,
      completedAt: '2026-08-01T10:00:00.000Z',
    })

    render(await CertificatesPage())

    expect(screen.getByTestId('dashboard-shell')).toHaveAttribute('data-active-path', '/certificates')
    expect(
      screen.getByRole('heading', { name: 'Artificial Intelligence & Generative AI' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Certificate domain' })).toHaveValue('ai')
    expect(screen.getByTestId('saved-certificate')).toHaveTextContent('11111111-1111-4111-8111-111111111111:4')
    expect(mockGetFirstCertificate).toHaveBeenCalledWith('learner@example.com')
  })

  it('shows an assessment action when no certificate has been issued', async () => {
    mockGetFirstCertificate.mockResolvedValue(null)

    render(await CertificatesPage())

    expect(screen.getByText('No certificate yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start assessment' })).toHaveAttribute('href', '/test/ai')
  })
})
