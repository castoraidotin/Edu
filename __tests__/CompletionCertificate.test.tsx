import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CompletionCertificate from '@/components/CompletionCertificate'
import { toBlob } from 'html-to-image'
import { CERTIFICATE_SHARE_TEXT } from '@/lib/certificate-share'

jest.mock('html-to-image', () => ({
  toBlob: jest.fn(),
}))

const mockToBlob = toBlob as jest.Mock

describe('CompletionCertificate', () => {
  const originalCreateObjectUrl = URL.createObjectURL
  const originalRevokeObjectUrl = URL.revokeObjectURL
  const originalOpen = window.open
  const originalShare = navigator.share
  const originalCanShare = navigator.canShare
  const originalClipboard = navigator.clipboard
  const originalExecCommand = document.execCommand

  beforeEach(() => {
    jest.clearAllMocks()
    mockToBlob.mockResolvedValue(new Blob(['certificate'], { type: 'image/png' }))
    URL.createObjectURL = jest.fn(() => 'blob:certificate')
    URL.revokeObjectURL = jest.fn()
    window.open = jest.fn()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
    })
    document.execCommand = jest.fn(() => false)
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectUrl
    URL.revokeObjectURL = originalRevokeObjectUrl
    window.open = originalOpen
    Object.defineProperty(navigator, 'share', { configurable: true, value: originalShare })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: originalCanShare })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: originalClipboard })
    document.execCommand = originalExecCommand
    jest.restoreAllMocks()
  })

  it('renders the branded verified certificate and Castor AI QR code', () => {
    render(
      <CompletionCertificate
        recipientName="Test User"
        score={9}
        attemptId="attempt-1234"
        completedAt="2026-08-26T12:00:00.000Z"
      />
    )

    expect(screen.getByRole('img', { name: 'Edu by Castor AI' })).toBeInTheDocument()
    expect(screen.getByLabelText('QR code for castorai.in')).toBeInTheDocument()
    expect(screen.getByText('Verified Certificate')).toBeInTheDocument()
    expect(screen.queryByText(/signature/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/not a professional accreditation/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Save a polished copy/i)).not.toBeInTheDocument()
  })

  it('exports the rendered certificate in a landscape certificate format', async () => {
    render(
      <CompletionCertificate
        recipientName="Test User"
        score={9}
        attemptId="attempt-1234"
        completedAt="2026-08-26T12:00:00.000Z"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Download PNG/i }))

    await waitFor(() => expect(mockToBlob).toHaveBeenCalled())
    expect(mockToBlob.mock.calls[0][0]).toBe(screen.getByTestId('certificate-artwork'))
    expect(mockToBlob.mock.calls[0][1]).toEqual(
      expect.objectContaining({ canvasWidth: 1400, canvasHeight: 1006, pixelRatio: 1 })
    )
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(await screen.findByRole('status')).toHaveTextContent(/downloaded as a high-resolution PNG/i)
  })

  it('shares the PNG file through the native share sheet when supported', async () => {
    const share = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: jest.fn(() => true) })
    render(<CompletionCertificate recipientName="Test User" score={8} attemptId="attempt-1234" />)

    fireEvent.click(screen.getByRole('button', { name: /Share certificate/i }))

    await waitFor(() => expect(share).toHaveBeenCalled())
    const shareData = share.mock.calls[0][0]
    expect(shareData.text).toBe(CERTIFICATE_SHARE_TEXT)
    expect(shareData.files[0]).toBeInstanceOf(File)
    expect(shareData.files[0].name).toBe('test-user-castor-ai-certificate.png')
  })

  it('opens LinkedIn with a certificate-specific preview URL and copies the post text', async () => {
    render(<CompletionCertificate recipientName="Test User" score={8} attemptId="attempt-1234" />)

    fireEvent.click(screen.getByRole('button', { name: /Share on LinkedIn/i }))

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(CERTIFICATE_SHARE_TEXT))
    const openedUrl = (window.open as jest.Mock).mock.calls[0][0] as string
    expect(openedUrl).toContain('linkedin.com/sharing/share-offsite')
    expect(decodeURIComponent(openedUrl)).toContain(
      'https://edu.castorai.in/certificate/attempt-1234?share=certificate-v1',
    )
    expect(await screen.findByRole('status')).toHaveTextContent(/certificate preview/i)
    expect(mockToBlob).not.toHaveBeenCalled()
  })

  it('prefills Twitter\/X with the exact post text and certificate URL', async () => {
    render(<CompletionCertificate recipientName="Test User" score={8} attemptId="attempt-1234" />)

    fireEvent.click(screen.getByRole('button', { name: /Share on Twitter\/X/i }))

    await waitFor(() => expect(window.open).toHaveBeenCalled())
    const openedUrl = new URL((window.open as jest.Mock).mock.calls[0][0] as string)
    expect(openedUrl.origin).toBe('https://x.com')
    expect(openedUrl.searchParams.get('text')).toBe(CERTIFICATE_SHARE_TEXT)
    expect(openedUrl.searchParams.get('url')).toBe(
      'https://edu.castorai.in/certificate/attempt-1234?share=certificate-v1',
    )
  })

  it('falls back to user-gesture copying when clipboard permission is denied', async () => {
    document.execCommand = jest.fn(() => true)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn().mockRejectedValue(new Error('Permission denied')) },
    })
    render(<CompletionCertificate recipientName="Test User" score={8} attemptId="attempt-1234" />)

    fireEvent.click(screen.getByRole('button', { name: /Share on Facebook/i }))

    await waitFor(() => expect(document.execCommand).toHaveBeenCalledWith('copy'))
    expect(await screen.findByRole('status')).toHaveTextContent(/post text is copied/i)
    expect(document.querySelector('textarea')).not.toBeInTheDocument()
  })

  it('labels X sharing as Twitter/X', () => {
    render(<CompletionCertificate recipientName="Test User" score={8} attemptId="attempt-1234" />)

    expect(screen.getByRole('button', { name: 'Share on Twitter/X' })).toBeInTheDocument()
  })
})
