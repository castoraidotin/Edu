import CertificateLibrary from '@/components/certificates/CertificateLibrary'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { getFirstCertificateForUser } from '@/lib/certificate-data'
import { requireProductAccess } from '@/lib/product-access-server'

export default async function CertificatesPage() {
  const { session } = await requireProductAccess()
  const userEmail = session.user?.email
  const certificate = userEmail ? await getFirstCertificateForUser(userEmail) : null

  return (
    <DashboardShell activePath="/certificates" title="Certificates">
      <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="mb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--signal)]">
            Achievements
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Certificates</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Certificates are issued from your first completed attempt. Their score and issue date stay
            unchanged if you retake an assessment.
          </p>
        </div>

        <CertificateLibrary
          recipientName={session.user?.name}
          items={[
            {
              domain: 'ai',
              label: 'Artificial Intelligence & Generative AI',
              description: 'Assessment completion certificate',
              assessmentHref: '/test/ai',
              certificate,
            },
          ]}
        />
      </div>
    </DashboardShell>
  )
}
