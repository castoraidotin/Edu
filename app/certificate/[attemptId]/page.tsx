import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CompletionCertificate from '@/components/CompletionCertificate'
import { getCertificateData } from '@/lib/certificate-data'
import { certificateShareUrl } from '@/lib/certificate-share'

export const dynamic = 'force-dynamic'

interface CertificatePageProps {
  params: Promise<{ attemptId: string }>
}
export async function generateMetadata({ params }: CertificatePageProps): Promise<Metadata> {
  const { attemptId } = await params
  const certificate = await getCertificateData(attemptId)
  if (!certificate) return { title: 'Certificate not found | Edu' }

  const url = certificateShareUrl(attemptId)
  const title = `${certificate.recipientName}'s AI Assessment Certificate`
  const description = `${certificate.recipientName} completed the Artificial Intelligence & Generative AI assessment by Castor AI.`
  const imageUrl = `${url}/opengraph-image`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const { attemptId } = await params
  const certificate = await getCertificateData(attemptId)
  if (!certificate) notFound()

  return (
    <main className="min-h-screen bg-[var(--paper)] px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <CompletionCertificate
          recipientName={certificate.recipientName}
          score={certificate.score}
          attemptId={certificate.attemptId}
          completedAt={certificate.completedAt}
        />
      </div>
    </main>
  )
}
