import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, MapPin } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { locationDisplayLabel } from '@/lib/location-availability'
import { getProductAccessState } from '@/lib/product-access-server'

export default async function ComingSoonPage() {
  const access = await getProductAccessState()
  if (access.status === 'signed-out') redirect('/login')
  if (access.status === 'profile-incomplete') redirect('/profile/complete')
  if (access.status === 'available') redirect('/dashboard')

  const location = locationDisplayLabel({
    city: access.profile.city,
    stateRegion: access.profile.state_region,
  })

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] size-[38rem] -translate-x-1/2 rounded-full bg-[var(--signal-soft)] blur-3xl" />

      <AppHeader />

      <section className="relative flex flex-1 items-center justify-center px-4 py-16 text-center sm:px-6">
        <div className="w-full max-w-xl">
          <h1 className="text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
            Coming soon to your city.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-7 text-muted-foreground">
            We&apos;re expanding to more cities. Check back soon.
          </p>

          <div className="mx-auto mt-7 flex w-fit max-w-full items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow-xs">
            <MapPin className="size-4 shrink-0 text-[var(--signal)]" />
            <span className="truncate">{location}</span>
          </div>

          <Button asChild variant="outline" size="lg" className="mt-8 bg-card">
            <Link href="/?from=coming-soon">Back to home <ArrowRight /></Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
