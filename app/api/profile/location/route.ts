import { NextRequest, NextResponse } from 'next/server'
import { isLaunchCity } from '@/lib/location-availability'
import { requireSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-server'

const MAX_FIELD_LENGTH = 200

export async function PATCH(req: NextRequest) {
  const { session, unauthorizedResponse } = await requireSession()
  if (!session) return unauthorizedResponse

  let body: { state_region?: string; city?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const stateRegion = body.state_region?.trim() ?? ''
  const city = body.city?.trim() ?? ''
  if (!stateRegion) return NextResponse.json({ error: 'State/Region is required' }, { status: 400 })
  if (!city) return NextResponse.json({ error: 'City is required' }, { status: 400 })
  if (stateRegion.length > MAX_FIELD_LENGTH || city.length > MAX_FIELD_LENGTH) {
    return NextResponse.json({ error: 'Location must be 200 characters or fewer' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('profiles').upsert({
    email: session.user.email,
    country: 'India',
    state_region: stateRegion,
    city,
  }, { onConflict: 'email' })

  if (error) {
    return NextResponse.json({ error: 'Failed to save location' }, { status: 500 })
  }

  return NextResponse.json({ available: isLaunchCity(city) })
}
