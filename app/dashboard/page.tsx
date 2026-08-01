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
import { ArrowUpRight, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ResultRow {
  domain: string
  score: number
  time_taken_seconds: number
  completed_at: string
}

export default async function DashboardPage() {
  const { session } = await requireProductAccess()

  const { data: rawResults } = await supabaseAdmin
    .from('test_results')
    .select('domain, score, time_taken_seconds, completed_at')
    .eq('user_email', session.user?.email)
    .order('completed_at', { ascending: false })

  const latestByDomain: Partial<Record<Domain, ResultRow>> = Object.fromEntries(
    latestByKey((rawResults ?? []) as ResultRow[], (row) => row.domain as Domain)
  )

  const completedResults = Object.values(latestByDomain).filter(
    (result): result is ResultRow => Boolean(result)
  )
  const hasAnyResult = completedResults.length > 0

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
          </aside>
        </div>
      </div>
    </DashboardShell>
  )
}
