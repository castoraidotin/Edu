'use client'

import { useEffect, useState } from 'react'
import type { Domain } from '@/lib/types'
import { ALL_DOMAINS, DOMAIN_LABELS_SHORT as DOMAIN_LABELS } from '@/lib/domains'
import { crowdFilterParams } from '@/lib/crowd-filter-params'
import ScoreGauge from '@/components/ui/ScoreGauge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface OverviewResponse {
  averageScoreByDomain: Partial<Record<Domain, number | null>>
  attemptCounts: Partial<Record<Domain, number>>
  mostAttemptedDomain: Domain | null
}

interface Props {
  designation: string
  experience: string
  country: string
  state_region: string
  city: string
}

export default function DomainOverview({ designation, experience, country, state_region, city }: Props) {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchOverview() {
      try {
        const params = new URLSearchParams(crowdFilterParams({ designation, experience, country, state_region, city }))
        const res = await fetch(`/api/stats/overview?${params}`)
        if (!res.ok) throw new Error('Failed to load overview')
        const json = await res.json()
        if (cancelled) return
        setData(json)
        setError('')
      } catch {
        if (!cancelled) setError('Could not load domain averages.')
      }
    }

    fetchOverview()
    return () => {
      cancelled = true
    }
  }, [designation, experience, country, state_region, city])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <div className="relative flex flex-wrap gap-4"><span className="sr-only">Loading domain averages…</span><Skeleton className="h-36 min-w-[220px] flex-1" /><Skeleton className="h-36 min-w-[220px] flex-1" /><Skeleton className="h-36 min-w-[220px] flex-1" /></div>

  return (
    // Flex-wrap (not a fixed-column grid) so five domain cards never leave a
    // ragged, half-empty trailing row — whatever doesn't fit on a line grows
    // to fill it evenly, at every viewport width.
    <div
      data-testid="domain-overview"
      className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4"
    >
      {ALL_DOMAINS.map((d) => {
        const avg = data.averageScoreByDomain[d]
        const count = data.attemptCounts[d] ?? 0
        const isMostAttempted = data.mostAttemptedDomain === d

        return (
          <Card key={d} className="min-w-0 gap-0 py-0 shadow-sm transition-shadow hover:shadow-md"><CardContent className="p-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-[var(--ink-soft)] uppercase tracking-wide">{DOMAIN_LABELS[d]}</p>
              {isMostAttempted && (
                <Badge
                  variant="secondary"
                  className="shrink-0 text-[10px]"
                  data-testid="most-attempted-badge"
                >
                  Most attempted
                </Badge>
              )}
            </div>
            <p className="font-mono text-2xl font-bold text-[var(--ink)]">
              {avg ?? '—'}
              <span className="text-sm font-medium text-[var(--ink-soft)] font-sans"> / 10 avg</span>
            </p>
            {typeof avg === 'number' && (
              <div className="mt-2">
                <ScoreGauge score={avg} />
              </div>
            )}
            <p className="text-xs text-[var(--ink-soft)] mt-2">
              {count} test-taker{count === 1 ? '' : 's'}
            </p>
          </CardContent></Card>
        )
      })}
    </div>
  )
}
