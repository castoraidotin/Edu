import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import UserMenu from '@/components/UserMenu'
import { isAdminEmail } from '@/lib/admin'
import { getAnalyticsSummary } from '@/lib/analytics-summary'
import { DOMAIN_LABELS_SHORT } from '@/lib/domains'
import type { FunnelEvent } from '@/lib/analytics'

// Internal-only funnel dashboard — not linked from anywhere in the app's nav.
// Gated by ADMIN_EMAILS (see lib/admin.ts); everyone else gets a plain
// "Not found" instead of a page that reveals this route even exists.

const EVENT_ORDER: FunnelEvent['name'][] = [
  'landing_viewed',
  'signup_started',
  'signup_completed',
  'domain_selected',
  'quiz_started',
  'quiz_completed',
  'result_viewed',
  'stats_viewed',
  'cta_clicked',
]

const EVENT_LABELS: Record<FunnelEvent['name'], string> = {
  landing_viewed: 'Landing viewed',
  signup_started: 'Signup started',
  signup_completed: 'Signup completed',
  domain_selected: 'Domain selected',
  quiz_started: 'Quiz started',
  quiz_completed: 'Quiz completed',
  result_viewed: 'Result viewed',
  stats_viewed: 'Stats viewed',
  cta_clicked: 'CTA clicked',
}

function formatDomain(domain: string): string {
  return DOMAIN_LABELS_SHORT[domain as keyof typeof DOMAIN_LABELS_SHORT] ?? domain
}

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 text-[var(--ink-soft)]">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[var(--paper)] border border-[var(--line)] overflow-hidden">
        <div className="h-full bg-[var(--action)]" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-medium text-[var(--ink)]">{count}</span>
    </div>
  )
}

export default async function AdminAnalyticsPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (!isAdminEmail(session.user?.email)) redirect('/dashboard')

  const summary = await getAnalyticsSummary()

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <AppHeader right={<UserMenu />} />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors mb-6"
        >
          &larr; Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-[var(--ink)] mb-1">Funnel Analytics</h1>

        {!summary ? (
          <p className="text-[var(--ink-soft)]">Could not load analytics. Try again shortly.</p>
        ) : (
          <>
            <p className="text-[var(--ink-soft)] mb-6">
              Last {summary.windowDays} days &middot; {summary.totalEvents} events
              {summary.averageQuizScore !== null && (
                <> &middot; avg quiz score {summary.averageQuizScore.toFixed(1)}/10</>
              )}
            </p>

            <section className="bg-[var(--surface)] rounded-lg border border-[var(--line)] shadow-sm p-4 mb-6">
              <h2 className="text-sm font-semibold text-[var(--ink)] mb-3">Funnel</h2>
              <div className="space-y-2">
                {EVENT_ORDER.map((name) => (
                  <Bar
                    key={name}
                    label={EVENT_LABELS[name]}
                    count={summary.countsByEvent[name] ?? 0}
                    max={summary.countsByEvent.landing_viewed ?? 0}
                  />
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <section className="bg-[var(--surface)] rounded-lg border border-[var(--line)] shadow-sm p-4">
                <h2 className="text-sm font-semibold text-[var(--ink)] mb-3">Domain selected</h2>
                {Object.keys(summary.countsByDomain).length === 0 ? (
                  <p className="text-sm text-[var(--ink-soft)]">No data yet.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(summary.countsByDomain)
                      .sort(([, a], [, b]) => b - a)
                      .map(([domain, count]) => (
                        <Bar
                          key={domain}
                          label={formatDomain(domain)}
                          count={count}
                          max={Math.max(...Object.values(summary.countsByDomain))}
                        />
                      ))}
                  </div>
                )}
              </section>

              <section className="bg-[var(--surface)] rounded-lg border border-[var(--line)] shadow-sm p-4">
                <h2 className="text-sm font-semibold text-[var(--ink)] mb-3">Castor CTA clicks</h2>
                {Object.keys(summary.countsByCtaLocation).length === 0 ? (
                  <p className="text-sm text-[var(--ink-soft)]">No data yet.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(summary.countsByCtaLocation)
                      .sort(([, a], [, b]) => b - a)
                      .map(([location, count]) => (
                        <Bar
                          key={location}
                          label={location}
                          count={count}
                          max={Math.max(...Object.values(summary.countsByCtaLocation))}
                        />
                      ))}
                  </div>
                )}
              </section>
            </div>

            <section className="bg-[var(--surface)] rounded-lg border border-[var(--line)] shadow-sm p-4">
              <h2 className="text-sm font-semibold text-[var(--ink)] mb-3">Recent events</h2>
              {summary.recentEvents.length === 0 ? (
                <p className="text-sm text-[var(--ink-soft)]">No events yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--ink-soft)] border-b border-[var(--line)]">
                        <th className="py-2 pr-4 font-medium">Event</th>
                        <th className="py-2 pr-4 font-medium">Props</th>
                        <th className="py-2 pr-4 font-medium">User</th>
                        <th className="py-2 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recentEvents.map((event, i) => (
                        <tr key={i} className="border-b border-[var(--line)] last:border-0">
                          <td className="py-2 pr-4 text-[var(--ink)]">{EVENT_LABELS[event.eventName]}</td>
                          <td className="py-2 pr-4 text-[var(--ink-soft)] font-mono text-xs">
                            {event.props ? JSON.stringify(event.props) : '—'}
                          </td>
                          <td className="py-2 pr-4 text-[var(--ink-soft)]">{event.userEmail ?? 'anonymous'}</td>
                          <td className="py-2 text-[var(--ink-soft)]">
                            {new Date(event.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
