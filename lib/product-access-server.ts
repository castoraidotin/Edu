import { redirect } from 'next/navigation'
import type { Session } from 'next-auth'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export interface ProductAccessProfile {
  profile_completed: boolean | null
  country: string | null
  state_region: string | null
  city: string | null
}

export type ProductAccessState =
  | { status: 'signed-out'; profile: null; session: null }
  | { status: 'profile-incomplete'; profile: ProductAccessProfile | null; session: Session }
  | { status: 'available'; profile: ProductAccessProfile; session: Session }

export async function getProductAccessState(): Promise<ProductAccessState> {
  const session = await auth()
  if (!session) return { status: 'signed-out', profile: null, session: null }

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('profile_completed, country, state_region, city')
    .eq('email', session.user?.email)
    .single()
  const profile = data as ProductAccessProfile | null
  if (!profile?.profile_completed || !profile.country || !profile.state_region || !profile.city) {
    return { status: 'profile-incomplete', profile, session }
  }
  return { status: 'available', profile, session }
}

export async function requireProductAccess() {
  const access = await getProductAccessState()
  if (access.status === 'signed-out') redirect('/login')
  if (access.status === 'profile-incomplete') redirect('/profile/complete')
  return access
}
