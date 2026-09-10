import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/auth'
import AppHeader from '@/components/AppHeader'
import ProfileEditForm from './ProfileEditForm'
import UserMenu from '@/components/UserMenu'
import { Button } from '@/components/ui/button'
import { supabaseAdmin } from '@/lib/supabase-server'

export default async function ProfilePage() {
  const session = await auth()
  if (!session) redirect('/login')

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, email, country, state_region, city, years_of_experience, designation, linkedin_url, company_name')
    .eq('email', session.user?.email)
    .single()

  return (
    <main className="min-h-screen bg-background">
      <AppHeader right={<UserMenu />} />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-7 text-muted-foreground">
          <Link href="/dashboard"><ArrowLeft /> Back to dashboard</Link>
        </Button>

        <div className="mb-8">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--signal)]">Account settings</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Your profile</h1>
          <p className="mt-2 text-muted-foreground">Keep your benchmark context accurate as your role and experience evolve.</p>
        </div>

        <ProfileEditForm
          initialValues={{
            full_name: profile?.full_name ?? session.user?.name ?? '',
            email: profile?.email ?? session.user?.email ?? '',
            country: profile?.country ?? '',
            state_region: profile?.state_region ?? '',
            city: profile?.city ?? '',
            years_of_experience: profile?.years_of_experience ?? '',
            designation: profile?.designation ?? '',
            linkedin_url: profile?.linkedin_url ?? '',
            company_name: profile?.company_name ?? '',
          }}
        />
      </div>
    </main>
  )
}
