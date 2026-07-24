import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { isRateLimited } from '@/lib/rate-limit'
import type { FunnelEvent } from '@/lib/analytics'

// Sink for funnel events fired by lib/analytics.ts's trackEvent(). Vercel Web
// Analytics gates all custom events behind a Pro plan, so this route is where
// events actually become queryable. Anonymous events (landing_viewed,
// signup_started) must be accepted — auth() is read but never enforced here.

const VALID_EVENT_NAMES: ReadonlySet<FunnelEvent['name']> = new Set([
  'landing_viewed',
  'signup_started',
  'signup_completed',
  'domain_selected',
  'quiz_started',
  'quiz_completed',
  'result_viewed',
  'stats_viewed',
  'cta_clicked',
])

const MAX_PROPS_KEYS = 20
const MAX_STRING_LEN = 500
const MAX_SESSION_ID_LEN = 64
const MAX_URL_LEN = 512

type PropValue = string | number | boolean | null

// Validates the untyped, parsed JSON body's `props` field is a flat object
// whose values are all Vercel-custom-event-compatible (no arrays, no nested
// objects), matching the same constraint lib/analytics.ts enforces client-side.
function isValidProps(props: unknown): props is Record<string, PropValue> {
  if (props === undefined) return true
  if (typeof props !== 'object' || props === null || Array.isArray(props)) return false

  const entries = Object.entries(props)
  if (entries.length > MAX_PROPS_KEYS) return false

  return entries.every(([, value]) => {
    if (value === null) return true
    if (typeof value === 'boolean' || typeof value === 'number') return true
    if (typeof value === 'string') return value.length <= MAX_STRING_LEN
    return false
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userEmail = session?.user?.email ?? null

  try {
    if (await isRateLimited(req, 'analytics-track', 300, 3600, userEmail ?? undefined)) {
      return NextResponse.json({ error: 'Too many events' }, { status: 429 })
    }
  } catch {
    // Fail open: dropping an analytics event is preferable to breaking the
    // caller's actual user flow over a rate-limit-check outage.
  }

  let body: { name?: unknown; props?: unknown; session_id?: unknown; url?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, props, session_id: sessionId, url } = body

  if (typeof name !== 'string' || !VALID_EVENT_NAMES.has(name as FunnelEvent['name'])) {
    return NextResponse.json({ error: 'Invalid event name' }, { status: 400 })
  }
  if (!isValidProps(props)) {
    return NextResponse.json({ error: 'Invalid props' }, { status: 400 })
  }
  if (sessionId !== undefined && (typeof sessionId !== 'string' || sessionId.length > MAX_SESSION_ID_LEN)) {
    return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })
  }
  if (url !== undefined && (typeof url !== 'string' || url.length > MAX_URL_LEN)) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('analytics_events').insert({
    event_name: name,
    event_props: props ?? null,
    user_email: userEmail,
    session_id: sessionId ?? null,
    url: url ?? null,
    user_agent: req.headers.get('user-agent'),
  })

  if (error) {
    // Never surface a DB error to the caller — an analytics write failing must
    // not look like a broken user flow. Log for our own visibility only.
    console.error('[POST /api/analytics/track] insert failed:', error.message)
  }

  return new NextResponse(null, { status: 204 })
}
