import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'
import { isAdminEmail } from '@/lib/admin'
import { getAnalyticsSummary } from '@/lib/analytics-summary'

// Internal-only funnel dashboard data — never exposed to normal users.
export async function GET() {
  const { session, unauthorizedResponse } = await requireSession()
  if (!session) return unauthorizedResponse

  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const summary = await getAnalyticsSummary()
  if (!summary) {
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }

  return NextResponse.json(summary)
}
