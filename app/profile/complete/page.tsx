'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Link as LinkIcon, MapPin, ShieldCheck } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import LogoutButton from '@/components/LogoutButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { BACKGROUND_OPTIONS, EXPERIENCE_OPTIONS } from '@/lib/profile-options'

const BASE_PROGRESS = 40
const ONBOARDING_COUNTRY = 'India'
const ONBOARDING_STATE_REGION = 'Telangana'
const UNAVAILABLE_CITY_COLOR = '#9ca3af'
const CITY_OPTIONS = [
  { name: 'Hyderabad', enabled: true },
  { name: 'Bangalore', enabled: false },
  { name: 'Chennai', enabled: false },
  { name: 'Delhi', enabled: false },
  { name: 'Mumbai', enabled: false },
] as const

export default function CompleteProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [city, setCity] = useState('')
  const [experience, setExperience] = useState('')
  const [background, setBackground] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const locationFilled = Boolean(city)
  const experienceFilled = Boolean(experience)
  const backgroundFilled = background.trim().length > 0
  const linkedinFilled = linkedin.trim().length > 0
  const requiredFilled = [locationFilled, experienceFilled, backgroundFilled].filter(Boolean).length
  const progress = BASE_PROGRESS + requiredFilled * 20
  const allRequiredFilled = requiredFilled === 3
  const checklist = [
    { label: 'Name', done: true },
    { label: 'Email', done: true },
    { label: 'Location', done: locationFilled },
    { label: 'Experience', done: experienceFilled },
    { label: 'Tech / Non-Tech', done: backgroundFilled },
    { label: 'LinkedIn', done: linkedinFilled, optional: true },
  ]
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allRequiredFilled) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: ONBOARDING_COUNTRY,
          state_region: ONBOARDING_STATE_REGION,
          city,
          years_of_experience: experience,
          designation: background,
          linkedin_url: linkedin,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Could not save your profile. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <AppHeader right={<LogoutButton />} />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-14">
        <aside>
          <div className="mb-6">
            <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-widest">One last step</Badge>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Complete your profile</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">A little context makes every benchmark more useful and more relevant to your career.</p>
          </div>
          <Card className="gap-0 py-0 lg:sticky lg:top-8">
            <CardHeader className="border-b p-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Profile readiness</CardTitle>
                <span data-testid="progress-percent" className="font-mono text-sm font-bold text-[var(--signal)]">{progress}%</span>
              </div>
              <Progress data-testid="progress-bar" value={progress} className="mt-2 h-1.5 bg-muted [&_[data-slot=progress-indicator]]:bg-[var(--signal)]" />
            </CardHeader>
            <CardContent className="p-5">
              <ul className="space-y-3">
                {checklist.map(({ label, done, optional }) => (
                  <li key={label} className="flex items-center gap-3 text-sm">
                    <span data-testid={`check-${label.toLowerCase()}`} className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${done ? 'bg-emerald-100 text-emerald-700' : optional ? 'bg-muted text-muted-foreground' : 'bg-destructive/8 text-destructive'}`}>
                      {done ? '✓' : optional ? '○' : '✗'}
                    </span>
                    <span className={done ? 'font-medium text-foreground' : 'text-muted-foreground'}>{label}{optional && <span className="ml-1 text-xs">(optional)</span>}</span>
                  </li>
                ))}
              </ul>
              <Separator className="my-5" />
              <div className="flex gap-2.5 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--signal)]" /><span>Your details are used only for private, aggregated comparisons.</span></div>
            </CardContent>
          </Card>
        </aside>

        <Card className="gap-0 overflow-hidden py-0 shadow-sm">
          <CardHeader className="border-b bg-muted/35 px-6 py-5">
            <CardTitle className="text-base">Professional context</CardTitle>
            <CardDescription>Required fields are marked by the progress checklist{session?.user?.email ? ` · ${session.user.email}` : ''}.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-7">
            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="space-y-2">
                <Label htmlFor="complete-city">City</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                  <NativeSelect
                    id="complete-city"
                    aria-label="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="pl-9"
                  >
                    <NativeSelectOption value="">Select city</NativeSelectOption>
                    {CITY_OPTIONS.map((option) => (
                      <NativeSelectOption
                        key={option.name}
                        value={option.name}
                        disabled={!option.enabled}
                        style={!option.enabled ? { color: UNAVAILABLE_CITY_COLOR } : undefined}
                      >
                        {option.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              <section className="space-y-4">
                <Label>Years of Experience</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {EXPERIENCE_OPTIONS.map((option) => {
                    const id = `complete-experience-${option.replace(/\W+/g, '-').toLowerCase()}`
                    return <Label key={option} htmlFor={id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 font-normal transition-colors hover:bg-accent/60 ${experience === option ? 'border-[var(--signal)] bg-accent/60' : ''}`}><input id={id} type="radio" name="experience" value={option} checked={experience === option} onChange={() => setExperience(option)} aria-label={option} className="size-4 accent-[var(--signal)]" />{option}</Label>
                  })}
                </div>
              </section>

              <section className="space-y-3">
                <Label>Are you Tech or Non-Tech?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {BACKGROUND_OPTIONS.map((option) => {
                    const id = `complete-background-${option.toLowerCase()}`
                    return <Label key={option} htmlFor={id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 font-normal transition-colors hover:bg-accent/60 ${background === option ? 'border-[var(--signal)] bg-accent/60' : ''}`}><input id={id} type="radio" name="background" value={option} checked={background === option} onChange={() => setBackground(option)} aria-label={option} className="size-4 accent-[var(--signal)]" />{option}</Label>
                  })}
                </div>
              </section>

              <div className="space-y-2"><Label htmlFor="complete-linkedin">LinkedIn Profile <span className="font-normal text-muted-foreground">(optional)</span></Label><div className="relative"><LinkIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="complete-linkedin" type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/yourname" className="pl-9" /></div></div>

              {error && <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={!allRequiredFilled || loading} size="lg" className="w-full">
                {loading ? 'Saving...' : <>Continue <ArrowRight /></>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
