'use client'

import { useEffect, useState } from 'react'
import type { Domain } from '@/lib/types'
import { crowdFilterParams } from '@/lib/crowd-filter-params'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface LeaderboardEntry {
  name: string
  score: number
  isYou: boolean
}

interface Props {
  domain: Domain
  designation: string
  experience: string
  country: string
  state_region: string
  city: string
}

export default function Leaderboard({ domain, designation, experience, country, state_region, city }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  // Set only when the API withheld names because too few people matched the
  // active filters — lets us tell that case apart from "nobody has attempted
  // this domain yet", which otherwise look identical (both are an empty list).
  const [suppressedCount, setSuppressedCount] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchLeaderboard() {
      try {
        const params = new URLSearchParams({
          domain,
          limit: '5',
          ...crowdFilterParams({ designation, experience, country, state_region, city }),
        })
        const res = await fetch(`/api/stats/leaderboard?${params}`)
        if (!res.ok) throw new Error('Failed to load leaderboard')
        const json = await res.json()
        if (cancelled) return
        setEntries(json.leaderboard)
        setSuppressedCount(typeof json.suppressedCount === 'number' ? json.suppressedCount : null)
        setError('')
      } catch {
        if (!cancelled) setError('Could not load the leaderboard.')
      }
    }

    fetchLeaderboard()
    return () => {
      cancelled = true
    }
  }, [domain, designation, experience, country, state_region, city])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!entries) return <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
  if (entries.length === 0 && suppressedCount !== null) {
    return (
      <p className="text-[var(--ink-soft)] text-sm">
        {suppressedCount} {suppressedCount === 1 ? 'person matches' : 'people match'} these filters — not enough to
        show names safely. Try broader filters.
      </p>
    )
  }
  if (entries.length === 0) return <p className="text-[var(--ink-soft)] text-sm">No attempts yet for this domain.</p>

  return (
    <Table data-testid="leaderboard">
      <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="w-16">Rank</TableHead><TableHead>Name</TableHead><TableHead className="text-right">Score</TableHead></TableRow></TableHeader>
      <TableBody>
      {entries.map((entry, i) => (
        <TableRow
          key={`${entry.name}-${i}`}
          className={entry.isYou ? 'bg-accent/70 hover:bg-accent' : ''}
        >
          <TableCell className="font-mono text-sm font-semibold text-muted-foreground">{String(i + 1).padStart(2, '0')}</TableCell>
          <TableCell className={entry.isYou ? 'font-semibold text-primary' : ''}>{entry.name}{entry.isYou && <Badge variant="secondary" className="ml-2 text-[10px]">(you)</Badge>}</TableCell>
          <TableCell className="text-right font-mono text-sm font-bold">{entry.score}/10</TableCell>
        </TableRow>
      ))}
      </TableBody>
    </Table>
  )
}
