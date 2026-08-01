import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/auth'
import AppHeader from '@/components/AppHeader'
import UserMenu from '@/components/UserMenu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { isAdminEmail } from '@/lib/admin'
import { getAnalyticsSummary } from '@/lib/analytics-summary'
import { DOMAIN_LABELS_SHORT } from '@/lib/domains'
import type { FunnelEvent } from '@/lib/analytics'

const EVENT_ORDER: FunnelEvent['name'][] = [
  'landing_viewed', 'signup_started', 'signup_completed', 'domain_selected', 'quiz_started',
  'quiz_completed', 'result_viewed', 'stats_viewed', 'cta_clicked',
]

const EVENT_LABELS: Record<FunnelEvent['name'], string> = {
  landing_viewed: 'Landing viewed', signup_started: 'Signup started', signup_completed: 'Signup completed',
  domain_selected: 'Domain selected', quiz_started: 'Quiz started', quiz_completed: 'Quiz completed',
  result_viewed: 'Result viewed', stats_viewed: 'Stats viewed', cta_clicked: 'CTA clicked',
}

function formatDomain(domain: string): string {
  return DOMAIN_LABELS_SHORT[domain as keyof typeof DOMAIN_LABELS_SHORT] ?? domain
}

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm sm:grid-cols-[10rem_minmax(0,1fr)_2.5rem]">
      <span className="truncate text-muted-foreground">{label}</span>
      <Progress value={pct} className="h-2 bg-muted [&_[data-slot=progress-indicator]]:bg-[var(--signal)]" />
      <span className="text-right font-mono font-semibold">{count}</span>
    </div>
  )
}

export default async function AdminAnalyticsPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (!isAdminEmail(session.user?.email)) redirect('/dashboard')
  const summary = await getAnalyticsSummary()

  return (
    <main className="min-h-screen bg-background">
      <AppHeader right={<UserMenu />} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-6 text-muted-foreground"><Link href="/dashboard"><ArrowLeft /> Back to dashboard</Link></Button>
        <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-[0.18em]">Internal analytics</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Funnel analytics</h1>

        {!summary ? (
          <p className="mt-4 text-muted-foreground">Could not load analytics. Try again shortly.</p>
        ) : (
          <>
            <p className="mb-7 mt-2 text-muted-foreground">
              Last {summary.windowDays} days · {summary.uniqueVisitors} unique visitors ({summary.totalEvents} events)
              {summary.averageQuizScore !== null && <> · avg quiz score {summary.averageQuizScore.toFixed(1)}/10</>}
            </p>

            <Card className="mb-6 gap-0 py-0 shadow-sm">
              <CardHeader className="px-5 pb-3 pt-5"><CardTitle className="text-base">Funnel</CardTitle><CardDescription>Unique visitors per step; repeat activity by the same visitor counts once.</CardDescription></CardHeader>
              <CardContent className="space-y-2.5 px-5 pb-5">
                {EVENT_ORDER.map((name) => <Bar key={name} label={EVENT_LABELS[name]} count={summary.countsByEvent[name] ?? 0} max={summary.countsByEvent.landing_viewed ?? 0} />)}
              </CardContent>
            </Card>

            <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Card className="gap-0 py-0 shadow-sm"><CardHeader className="p-5 pb-3"><CardTitle className="text-base">Domain selected</CardTitle></CardHeader><CardContent className="px-5 pb-5">
                {Object.keys(summary.countsByDomain).length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : <div className="space-y-2.5">{Object.entries(summary.countsByDomain).sort(([, a], [, b]) => b - a).map(([domain, count]) => <Bar key={domain} label={formatDomain(domain)} count={count} max={Math.max(...Object.values(summary.countsByDomain))} />)}</div>}
              </CardContent></Card>

              <Card className="gap-0 py-0 shadow-sm"><CardHeader className="p-5 pb-3"><CardTitle className="text-base">Castor CTA <span className="font-normal text-muted-foreground">(unique clickers)</span></CardTitle></CardHeader><CardContent className="px-5 pb-5">
                {Object.keys(summary.countsByCtaLocation).length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : <div className="space-y-2.5">{Object.entries(summary.countsByCtaLocation).sort(([, a], [, b]) => b - a).map(([location, count]) => <Bar key={location} label={location} count={count} max={Math.max(...Object.values(summary.countsByCtaLocation))} />)}</div>}
              </CardContent></Card>
            </div>

            <Card className="gap-0 py-0 shadow-sm"><CardHeader className="p-5 pb-3"><CardTitle className="text-base">Recent events</CardTitle></CardHeader><CardContent className="px-5 pb-5">
              {summary.recentEvents.length === 0 ? <p className="text-sm text-muted-foreground">No events yet.</p> : (
                <Table>
                  <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Event</TableHead><TableHead>Props</TableHead><TableHead>User</TableHead><TableHead>When</TableHead></TableRow></TableHeader>
                  <TableBody>{summary.recentEvents.map((event, index) => (
                    <TableRow key={index}>
                      <TableCell>{EVENT_LABELS[event.eventName]}</TableCell>
                      <TableCell className="max-w-sm truncate font-mono text-xs text-muted-foreground">{event.props ? JSON.stringify(event.props) : '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{event.userEmail ?? 'anonymous'}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent></Card>
          </>
        )}
      </div>
    </main>
  )
}
