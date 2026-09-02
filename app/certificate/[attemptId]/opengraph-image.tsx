import { ImageResponse } from 'next/og'
import { getCertificateData } from '@/lib/certificate-data'
import { certificateAchievementText } from '@/lib/certificate-share'

export const alt = 'Edu by Castor AI assessment completion certificate'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

export default async function OpenGraphCertificateImage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId } = await params
  const certificate = await getCertificateData(attemptId)
  const recipientName = certificate?.recipientName ?? 'AI learner'
  const completedAt = certificate?.completedAt
    ? new Date(certificate.completedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'On completion'
  const certificateId = `EDU-AI-${attemptId.replace(/-/g, '').slice(0, 10).toUpperCase()}`
  const achievementText = certificateAchievementText(certificate?.topPercent)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#eaf1fa',
          padding: 18,
        }}
      >
        <div
          style={{
            width: 830,
            height: 594,
            display: 'flex',
            padding: 24,
            background: 'linear-gradient(145deg,#24965e,#117846 48%,#064725)',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#fffefb',
              border: '2px solid #2d6b4a',
              boxShadow: 'inset 0 0 0 5px #fffefb, inset 0 0 0 7px rgba(45,107,74,0.62)',
              color: '#19201d',
              padding: '34px 42px',
            }}
          >
            {/* ImageResponse renders through Satori, where a native img is required. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://edu.castorai.in/logo.jpg"
              width={108}
              height={48}
              alt="Edu by Castor AI"
              style={{ objectFit: 'contain' }}
            />
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', fontFamily: 'serif', fontSize: 31, letterSpacing: 1.5, color: '#234d3c' }}>
              CERTIFICATE <span style={{ fontStyle: 'italic', textTransform: 'lowercase' }}>of</span> COMPLETION
            </div>
            <div style={{ marginTop: 15, width: 255, height: 1, background: '#8ca699' }} />
            <div style={{ marginTop: 20, fontSize: 16 }}>Awarded to</div>
            <div style={{ marginTop: 8, fontFamily: 'serif', fontSize: 48, color: '#27925a' }}>{recipientName}</div>
            <div style={{ marginTop: 17, display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 16, lineHeight: 1.35 }}>
              <div style={{ maxWidth: 610, textAlign: 'center' }}>{achievementText}</div>
            </div>

            <div style={{ position: 'absolute', left: 54, bottom: 38, display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#6f7c76' }}>
              <div style={{ fontSize: 13 }}>Certificate website</div>
              <div style={{ marginTop: 4, fontSize: 15, fontWeight: 600, color: '#245a42' }}>castorai.in</div>
            </div>

            <div
              style={{
                position: 'absolute',
                right: 0,
                bottom: 67,
                width: 300,
                height: 52,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#d4efdf',
                color: '#245a42',
                fontFamily: 'serif',
                fontSize: 22,
              }}
            >
              Verified Certificate
            </div>

            <div style={{ position: 'absolute', right: 38, bottom: 23, display: 'flex', gap: 28, color: '#7d8984', fontSize: 11 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span>Certificate ID</span>
                <span style={{ marginTop: 3, fontFamily: 'monospace' }}>{certificateId}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span>Issuing date</span>
                <span style={{ marginTop: 3 }}>{completedAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
