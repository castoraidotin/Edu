import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireProductAccess } from '@/lib/product-access-server'
import DomainSelector from '@/components/DomainSelector'
import DashboardShell from '@/components/dashboard/DashboardShell'
import CastorPromoBanner from '@/components/dashboard/CastorPromoBanner'
import ScoreGauge from '@/components/ui/ScoreGauge'
import type { Domain } from '@/lib/types'
import { DOMAIN_LABELS_SHORT as DOMAIN_LABELS } from '@/lib/domains'
import { latestByKey } from '@/lib/latest-by-key'
import { latestResultsForDomain } from '@/lib/latest-results'
import { rankWithinCohort } from '@/lib/stats-calculations'
import { ArrowRight, ArrowUpRight, BarChart3, Gauge, MapPin, Target, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ResultRow {
  domain: string
  score: number
  time_taken_seconds: number
  completed_at: string
}

interface PeerProfileRow {
  email: string
  city: string | null
}

interface PeerSnapshot {
  rank: number | null
  percentile: number | null
  cohortSize: number
  cityAverage: number | null
  scoreGap: number | null
}

export default async function DashboardPage() {
  const { session, profile } = await requireProductAccess()
  const userEmail = session.user.email!

  const { data: rawResults } = await supabaseAdmin
    .from('test_results')
    .select('domain, score, time_taken_seconds, completed_at')
    .eq('user_email', userEmail)
    .order('completed_at', { ascending: false })

  const latestByDomain: Partial<Record<Domain, ResultRow>> = Object.fromEntries(
    latestByKey((rawResults ?? []) as ResultRow[], (row) => row.domain as Domain)
  )

  const completedResults = Object.values(latestByDomain).filter(
    (result): result is ResultRow => Boolean(result)
  )
  const hasAnyResult = completedResults.length > 0
  const userResults = (rawResults ?? []) as ResultRow[]
  const latestDomain = userResults[0]?.domain as Domain | undefined
  const latestScore = userResults[0]?.score ?? null
  let peerSnapshot: PeerSnapshot | null = null

  if (latestDomain && latestScore !== null && profile.city) {
    const { data: cohortResults, error: cohortError } = await latestResultsForDomain(latestDomain)
    if (!cohortError && cohortResults) {
      const latestByEmail = latestByKey(cohortResults, (result) => result.user_email)
      const cohortEmails = [...latestByEmail.keys()]

      if (cohortEmails.length > 0) {
        const { data: cohortProfiles, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('email, city')
          .in('email', cohortEmails)

        if (!profileError && cohortProfiles) {
          const normalizedCity = profile.city.trim().toLocaleLowerCase('en-IN')
          const cityEmails = new Set(
            (cohortProfiles as PeerProfileRow[])
              .filter((peer) => peer.city?.trim().toLocaleLowerCase('en-IN') === normalizedCity)
              .map((peer) => peer.email)
          )
          const cityScores = cohortEmails
            .filter((email) => cityEmails.has(email))
            .map((email) => latestByEmail.get(email)?.score)
            .filter((score): score is number => score !== undefined)
          const cityRank = rankWithinCohort(
            latestByEmail.get(userEmail)?.score ?? latestScore,
            cityScores,
            cityEmails.has(userEmail)
          )

          peerSnapshot = {
            rank: cityRank.rank,
            percentile: cityRank.percentile,
            cohortSize: cityRank.cohortSize,
            cityAverage: cityRank.averageScore,
            scoreGap: cityRank.averageScore === null
              ? null
              : Math.round((latestScore - cityRank.averageScore) * 10) / 10,
          }
        }
      }
    }
  }

  const cityName = profile.city || 'Your city'
  const snapshotMetrics = [
    {
      label: 'Peers outscored',
      value: peerSnapshot?.percentile === null || peerSnapshot?.percentile === undefined ? '—' : `${peerSnapshot.percentile}%`,
      detail: `in ${cityName}`,
      icon: Users,
    },
    {
      label: `${cityName} rank`,
      value: peerSnapshot?.rank === null || peerSnapshot?.rank === undefined ? '—' : `#${peerSnapshot.rank}`,
      detail: peerSnapshot?.cohortSize ? `of ${peerSnapshot.cohortSize}` : 'Building your cohort',
      icon: MapPin,
    },
    {
      label: `${cityName} average`,
      value: peerSnapshot?.cityAverage === null || peerSnapshot?.cityAverage === undefined ? '—' : `${peerSnapshot.cityAverage}/10`,
      detail: latestDomain ? DOMAIN_LABELS[latestDomain] : 'Latest domain',
      icon: Gauge,
    },
    {
      label: 'Your score gap',
      value: peerSnapshot?.scoreGap === null || peerSnapshot?.scoreGap === undefined
        ? '—'
        : `${peerSnapshot.scoreGap > 0 ? '+' : ''}${peerSnapshot.scoreGap} pts`,
      detail: `vs ${cityName} average`,
      icon: Target,
    },
  ]

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-[1532px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <CastorPromoBanner />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)] lg:items-start">
          <section id="assessments" className="scroll-mt-24">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold tracking-tight">Assessments</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Start with AI &amp; Generative AI. More assessment domains are on the way.
              </p>
            </div>
            <DomainSelector />
          </section>

          <aside className="lg:sticky lg:top-24">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Latest results</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your most recent score in each domain.</p>
              </div>
              {hasAnyResult && (
                <Button asChild variant="ghost" size="sm" className="-mr-2 shrink-0 text-muted-foreground hover:text-foreground">
                  <Link href="/stats">View insights <ArrowUpRight /></Link>
                </Button>
              )}
            </div>

            {hasAnyResult ? (
              <div className="grid gap-2.5">
                {completedResults.map((result) => {
                  const domain = result.domain as Domain
                  const mins = Math.floor(result.time_taken_seconds / 60)
                  const secs = result.time_taken_seconds % 60

                  return (
                    <Link
                      href={`/stats?domain=${domain}`}
                      key={domain}
                      className="group rounded-xl border bg-card px-4 py-4 shadow-xs transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[var(--signal)]/35 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{DOMAIN_LABELS[domain]}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(result.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            <span aria-hidden="true"> · </span>
                            {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2.5">
                          <p className="font-mono text-xl font-semibold leading-none">
                            {result.score}<span className="text-xs font-medium text-muted-foreground">/10</span>
                          </p>
                          <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-[var(--signal)]" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <ScoreGauge score={result.score} />
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed bg-card/45 p-5">
                <BarChart3 className="size-5 text-muted-foreground" />
                <p className="mt-4 text-sm font-medium">No results yet</p>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  Your latest scores will appear here after your first assessment.
                </p>
              </div>
            )}

            {hasAnyResult && latestDomain ? (
              <Link
                href={`/stats?domain=${latestDomain}`}
                data-testid="dashboard-stats-teaser"
                className="group mt-6 block rounded-xl border bg-card p-4 shadow-xs transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[var(--signal)]/35 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold">Your snapshot</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">A quick look across all your attempts.</p>
                  </div>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--signal-soft)] text-[var(--signal)] transition-colors group-hover:bg-[var(--signal)] group-hover:text-white">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {snapshotMetrics.map(({ label, value, detail, icon: Icon }) => (
                    <div key={label} className="rounded-lg bg-muted/55 p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Icon className="size-3.5" />
                        <span className="text-[11px] font-medium">{label}</span>
                      </div>
                      <p className="mt-2 font-mono text-lg font-semibold leading-none">{value}</p>
                      <p className="mt-1.5 text-[10px] text-muted-foreground">{detail}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3 text-xs">
                  <span className="text-muted-foreground">See your percentile, peer rank, and score trends.</span>
                  <span className="flex shrink-0 items-center gap-1 font-semibold text-[var(--signal)]">
                    View insights <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ) : (
              <div data-testid="dashboard-stats-teaser-locked" className="mt-6 rounded-xl border border-dashed bg-card/45 p-4">
                <h3 className="text-sm font-semibold">Your snapshot</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Complete an assessment to unlock your performance stats.</p>
                <div className="mt-4 grid grid-cols-2 gap-2 opacity-50">
                  {snapshotMetrics.map(({ label, value, detail, icon: Icon }) => (
                    <div key={label} className="rounded-lg bg-muted/55 p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Icon className="size-3.5" />
                        <span className="text-[11px] font-medium">{label}</span>
                      </div>
                      <p className="mt-2 font-mono text-lg font-semibold leading-none">{value}</p>
                      <p className="mt-1.5 text-[10px] text-muted-foreground">{detail}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">Percentile, peer rank, and score trends appear after your first result.</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </DashboardShell>
  )
}
