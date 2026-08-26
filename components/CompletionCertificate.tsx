'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Download, ExternalLink, LoaderCircle, Share2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  CERTIFICATE_SHARE_TEXT,
  CERTIFICATE_TITLE,
  certificateShareUrl,
} from '@/lib/certificate-share'

interface CompletionCertificateProps {
  recipientName?: string | null
  score: number
  attemptId?: string | null
  completedAt?: string
}

type SharePlatform = 'linkedin' | 'x' | 'facebook'
type ExportStatus = { tone: 'success' | 'error'; message: string } | null

const CASTOR_SITE_URL = 'https://castorai.in'

function certificateFileName(name: string) {
  const safeName = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return `${safeName || 'learner'}-castor-ai-certificate.png`
}

function platformShareUrl(platform: SharePlatform, caption: string, certificateUrl: string) {
  const url = encodeURIComponent(certificateUrl)
  const text = encodeURIComponent(caption)

  if (platform === 'linkedin') {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
  }

  if (platform === 'x') {
    return `https://x.com/intent/tweet?text=${text}&url=${url}`
  }

  return `https://www.facebook.com/sharer/sharer.php?u=${url}`
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = fileName
  link.href = objectUrl
  link.click()
  URL.revokeObjectURL(objectUrl)
}

async function copyShareText(text: string) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.readOnly = true
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    if (document.execCommand('copy')) return true
  } catch {
    // Fall through to the async Clipboard API.
  } finally {
    textarea.remove()
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // The caller shows a manual-copy message when both browser paths fail.
  }

  return false
}

export default function CompletionCertificate({
  recipientName,
  score,
  attemptId,
  completedAt,
}: CompletionCertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [status, setStatus] = useState<ExportStatus>(null)
  const displayName = recipientName?.trim() || 'AI learner'
  const issuedDateLabel = completedAt
    ? new Date(completedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Issued on completion'
  const issuedDateShort = completedAt
    ? new Date(completedAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'On completion'
  const issuedYear = completedAt ? new Date(completedAt).getFullYear() : new Date().getFullYear()
  const credentialId = `EDU-AI-${(attemptId ?? 'COMPLETED').replace(/-/g, '').slice(0, 10).toUpperCase()}`
  const caption = CERTIFICATE_SHARE_TEXT
  const shareUrl = certificateShareUrl(attemptId)
  const socialShareUrl = attemptId ? `${shareUrl}?share=certificate-v1` : shareUrl
  const fileName = certificateFileName(displayName)

  async function renderCertificate() {
    if (!certificateRef.current) throw new Error('Certificate is not ready')
    await document.fonts?.ready
    const { toBlob } = await import('html-to-image')
    const blob = await toBlob(certificateRef.current, {
      backgroundColor: '#10233f',
      cacheBust: true,
      canvasWidth: 1400,
      canvasHeight: 1006,
      pixelRatio: 1,
    })
    if (!blob) throw new Error('Certificate export failed')
    return blob
  }

  async function handleDownload() {
    setIsExporting(true)
    setStatus(null)
    try {
      const blob = await renderCertificate()
      downloadBlob(blob, fileName)
      setStatus({ tone: 'success', message: 'Certificate downloaded as a high-resolution PNG.' })
    } catch {
      setStatus({ tone: 'error', message: 'Could not export the certificate. Please try again.' })
    } finally {
      setIsExporting(false)
    }
  }

  async function handleNativeShare() {
    setIsExporting(true)
    setStatus(null)
    try {
      const blob = await renderCertificate()
      const file = new File([blob], fileName, { type: 'image/png' })
      const shareData = { title: CERTIFICATE_TITLE, text: caption, files: [file] }

      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData)
        setStatus({ tone: 'success', message: 'Certificate shared.' })
      } else {
        downloadBlob(blob, fileName)
        setStatus({
          tone: 'success',
          message: 'Your browser cannot share image files directly, so the certificate was downloaded instead.',
        })
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setStatus({ tone: 'error', message: 'Could not share the certificate. Please try downloading it.' })
    } finally {
      setIsExporting(false)
    }
  }

  async function handlePlatformShare(platform: SharePlatform) {
    setStatus(null)

    const platformLabel =
      platform === 'linkedin' ? 'LinkedIn' : platform === 'x' ? 'Twitter/X' : 'Facebook'
    if (platform === 'x') {
      setStatus({
        tone: 'success',
        message: `${platformLabel} opened with the post text and certificate preview ready.`,
      })
      return
    }

    const copied = await copyShareText(caption)
    setStatus({
      tone: 'success',
      message: copied
        ? `${platformLabel} opened with your certificate preview. The post text is copied—paste it into the composer.`
        : `${platformLabel} opened with your certificate preview. Add the sharing text before posting.`,
    })
  }

  return (
    <Card data-testid="ai-completion-certificate" className="gap-0 overflow-hidden py-0 shadow-xl shadow-slate-900/10">
      <div className="border-b border-[var(--line)] px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--signal)]">
              Achievement unlocked
            </p>
            <h2 className="text-xl font-bold text-[var(--ink)] sm:text-2xl">Your certificate is ready</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <PlatformLink
              platform="linkedin"
              label="LinkedIn"
              mark="in"
              href={platformShareUrl('linkedin', caption, socialShareUrl)}
              onClick={() => void handlePlatformShare('linkedin')}
            />
            <PlatformLink
              platform="x"
              label="Twitter/X"
              mark="X"
              href={platformShareUrl('x', caption, socialShareUrl)}
              onClick={() => void handlePlatformShare('x')}
            />
            <PlatformLink
              platform="facebook"
              label="Facebook"
              mark="f"
              href={platformShareUrl('facebook', caption, socialShareUrl)}
              onClick={() => void handlePlatformShare('facebook')}
            />
          </div>
        </div>
      </div>

      <div className="bg-[var(--paper)] p-3 sm:p-7">
        <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
          <div
            ref={certificateRef}
            data-testid="certificate-artwork"
            className="relative aspect-[1.39/1] min-w-0 overflow-hidden bg-[#eaf1fa] text-[#19201d] [container-type:inline-size]"
          >
            <div className="absolute inset-[1.35%] overflow-hidden bg-[linear-gradient(145deg,#24965e_0%,#117846_45%,#064725_100%)]">
              <div className="absolute inset-[3.65%] overflow-hidden bg-[#fffefb] shadow-[0_2px_8px_rgba(0,42,23,0.16)]">
                <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(45deg,transparent_46%,rgba(30,117,77,0.07)_47%,rgba(30,117,77,0.07)_49%,transparent_50%),linear-gradient(-45deg,transparent_46%,rgba(30,117,77,0.07)_47%,rgba(30,117,77,0.07)_49%,transparent_50%)] [background-position:0_0,0_0] [background-size:23px_23px]" />

                <div className="absolute inset-[3.25%] rounded-[1.7%] border-2 border-[#2d6b4a]/70" />
                <div className="absolute inset-[4.15%] rounded-[1.2%] border border-[#2d6b4a]/70" />

                <span className="absolute left-[2.9%] top-[5.1%] h-[4.4%] w-[2.2%] border-l-2 border-t-2 border-[#2d6b4a]" />
                <span className="absolute right-[2.9%] top-[5.1%] h-[4.4%] w-[2.2%] border-r-2 border-t-2 border-[#2d6b4a]" />
                <span className="absolute bottom-[5.1%] left-[2.9%] h-[4.4%] w-[2.2%] border-b-2 border-l-2 border-[#2d6b4a]" />
                <span className="absolute bottom-[5.1%] right-[2.9%] h-[4.4%] w-[2.2%] border-b-2 border-r-2 border-[#2d6b4a]" />

                <Image
                  src="/logo.jpg"
                  alt="Edu by Castor AI"
                  width={736}
                  height={330}
                  className="absolute left-1/2 top-[8.6%] h-auto w-[13.5%] -translate-x-1/2 mix-blend-multiply"
                  priority
                />

                <p className="absolute left-1/2 top-[21%] w-full -translate-x-1/2 text-center font-serif text-[clamp(13px,3.3cqw,39px)] uppercase leading-[1.15] tracking-[0.035em] text-[#234d3c]">
                  Certificate <span className="normal-case italic">of</span> Completion
                </p>
                <div className="absolute left-1/2 top-[31.7%] h-px w-[31%] -translate-x-1/2 bg-[#446f5d]/55" />

                <p className="absolute left-1/2 top-[36.6%] -translate-x-1/2 text-[clamp(7px,1.7cqw,18px)] font-medium leading-[1.25] text-[#27312d]">
                  Awarded to
                </p>
                <h3 className="absolute left-1/2 top-[42%] max-w-[76%] -translate-x-1/2 truncate whitespace-nowrap font-serif text-[clamp(21px,6.1cqw,72px)] leading-none tracking-[-0.035em] text-[#27925a]">
                  {displayName}
                </h3>

                <p className="absolute left-1/2 top-[56.5%] w-[72%] -translate-x-1/2 text-center text-[clamp(7px,1.65cqw,19px)] leading-[1.25] text-[#222a26]">
                  For completing the assessment “Artificial Intelligence &amp; Generative AI”
                  <br />
                  with a score of <span className="font-semibold">{score}/10</span> on <span className="font-semibold">{issuedDateLabel}</span>
                </p>

                <div className="absolute bottom-[9.2%] left-[17%] flex w-[15%] flex-col items-center text-center">
                  <QRCodeSVG
                    value={CASTOR_SITE_URL}
                    size={96}
                    level="M"
                    bgColor="#fffefb"
                    fgColor="#174b35"
                    className="size-[clamp(32px,5.6cqw,74px)]"
                    aria-label="QR code for castorai.in"
                  />
                  <p className="mt-[5%] text-[clamp(5px,1.15cqw,12px)] leading-[1.15] text-[#87908c]">
                    Certificate website:
                    <br />
                    <span className="font-medium">castorai.in</span>
                  </p>
                </div>

                <div className="absolute right-[-0.1%] top-[68.2%] flex h-[8.4%] w-[35%] items-center bg-[#d4efdf] pl-[7%] pr-[3%] text-[#245a42] [clip-path:polygon(8%_0,100%_0,100%_100%,8%_100%,0_50%)]">
                  <span className="font-serif text-[clamp(9px,2.15cqw,24px)] leading-[1.2]">Verified Certificate</span>
                  <span className="ml-auto font-serif text-[clamp(6px,1.35cqw,15px)] leading-[1.2]">{issuedYear}</span>
                </div>

                <div className="absolute bottom-[10.2%] right-[10%] grid w-[26%] grid-cols-2 gap-[8%] text-center">
                  <CertificateMeta label="Certificate ID:" value={credentialId} mono />
                  <CertificateMeta label="Issuing Date:" value={issuedDateShort} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--line)] bg-white px-5 py-5 sm:px-7">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button size="lg" onClick={handleNativeShare} disabled={isExporting}>
            {isExporting ? <LoaderCircle className="animate-spin" /> : <Share2 />}
            Share certificate
          </Button>
          <Button size="lg" variant="outline" onClick={handleDownload} disabled={isExporting}>
            <Download /> Download PNG
          </Button>
        </div>

        {status && (
          <p
            role="status"
            className={`mt-4 rounded-md px-3 py-2 text-xs ${
              status.tone === 'success'
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {status.message}
          </p>
        )}
      </div>
    </Card>
  )
}

function CertificateMeta({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="text-[clamp(5px,1.05cqw,12px)] leading-[1.15] text-[#98a09d]">{label}</p>
      <p
        className={`mt-[2%] truncate text-[clamp(5px,1cqw,12px)] font-medium leading-[1.15] text-[#87908c] ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}

function PlatformLink({
  platform,
  label,
  mark,
  href,
  onClick,
}: {
  platform: SharePlatform
  label: string
  mark: string
  href: string
  onClick: () => void
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-label={`Share on ${label}`}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[var(--line)] bg-white px-2 text-xs font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--paper)]"
    >
      <span
        className={`flex size-4 items-center justify-center font-sans text-[9px] font-bold ${
          platform === 'linkedin'
            ? 'rounded-[2px] bg-[#0A66C2] text-white'
            : platform === 'facebook'
              ? 'rounded-full bg-[#1877F2] text-[11px] text-white'
              : 'bg-transparent text-[12px] font-medium text-black'
        }`}
        aria-hidden="true"
      >
        {mark}
      </span>
      <span className="hidden sm:inline">{label}</span>
      <ExternalLink className="size-3 text-[var(--ink-soft)]" aria-hidden="true" />
    </a>
  )
}
