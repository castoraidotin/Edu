'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Award } from 'lucide-react'
import CompletionCertificate from '@/components/CompletionCertificate'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import type { CertificateSummary, Domain } from '@/lib/types'

export interface CertificateLibraryItem {
  domain: Domain
  label: string
  description: string
  assessmentHref: string
  certificate: CertificateSummary | null
}

interface CertificateLibraryProps {
  recipientName?: string | null
  items: CertificateLibraryItem[]
}

export default function CertificateLibrary({ recipientName, items }: CertificateLibraryProps) {
  const [selectedDomain, setSelectedDomain] = useState<Domain>(items[0]?.domain ?? 'ai')
  const selectedItem = items.find((item) => item.domain === selectedDomain) ?? items[0]

  if (!selectedItem) return null

  return (
    <section aria-labelledby="certificate-domain-heading">
      <div className="mb-8 w-full max-w-md">
        <Label htmlFor="certificate-domain" className="mb-2 block text-sm font-medium">
          Browse by domain
        </Label>
        <NativeSelect
          id="certificate-domain"
          value={selectedDomain}
          onChange={(event) => setSelectedDomain(event.target.value as Domain)}
          aria-label="Certificate domain"
        >
          {items.map((item) => (
            <NativeSelectOption key={item.domain} value={item.domain}>
              {item.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="mb-5 border-b pb-4">
        <h2 id="certificate-domain-heading" className="text-lg font-semibold tracking-tight">
          {selectedItem.label}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{selectedItem.description}</p>
      </div>

      {selectedItem.certificate ? (
        <CompletionCertificate
          recipientName={recipientName}
          score={selectedItem.certificate.score}
          attemptId={selectedItem.certificate.attemptId}
          completedAt={selectedItem.certificate.completedAt}
        />
      ) : (
        <div className="rounded-xl border border-dashed bg-card/45 px-5 py-12 text-center sm:px-8">
          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--signal)]/10 text-[var(--signal)]">
            <Award className="size-5" />
          </span>
          <h3 className="mt-4 text-base font-semibold">No certificate yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Complete this assessment once to issue your permanent certificate.
          </p>
          <Button asChild className="mt-5">
            <Link href={selectedItem.assessmentHref}>Start assessment</Link>
          </Button>
        </div>
      )}
    </section>
  )
}
