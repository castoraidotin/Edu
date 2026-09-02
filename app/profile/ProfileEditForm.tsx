'use client'

import { useState } from 'react'
import { CheckCircle2, Link as LinkIcon, MapPin, Save } from 'lucide-react'
import { Country, State, City } from 'country-state-city'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Separator } from '@/components/ui/separator'
import { BACKGROUND_OPTIONS, EXPERIENCE_OPTIONS } from '@/lib/profile-options'

interface Props {
  initialValues: {
    full_name: string
    email: string
    country: string
    state_region: string
    city: string
    years_of_experience: string
    designation: string
    linkedin_url: string
  }
}

function nameToCountryCode(name: string): string {
  if (!name) return ''
  return Country.getAllCountries().find((country) => country.name === name)?.isoCode ?? ''
}

function nameToStateCode(name: string, countryCode: string): string {
  if (!name || !countryCode) return ''
  return State.getStatesOfCountry(countryCode).find((state) => state.name === name)?.isoCode ?? ''
}

export default function ProfileEditForm({ initialValues }: Props) {
  const initialCountryCode = nameToCountryCode(initialValues.country)
  const initialStateCode = nameToStateCode(initialValues.state_region, initialCountryCode)
  const initialBackground = BACKGROUND_OPTIONS.includes(initialValues.designation as (typeof BACKGROUND_OPTIONS)[number]) ? initialValues.designation : ''

  const [country, setCountry] = useState(initialCountryCode)
  const [stateRegion, setStateRegion] = useState(initialStateCode)
  const [city, setCity] = useState(initialValues.city)
  const [experience, setExperience] = useState(initialValues.years_of_experience)
  const [background, setBackground] = useState(initialBackground)
  const [linkedin, setLinkedin] = useState(initialValues.linkedin_url)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const states = State.getStatesOfCountry(country)
  const cities = City.getCitiesOfState(country, stateRegion)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: Country.getCountryByCode(country)?.name ?? country,
          state_region: State.getStateByCodeAndCountry(stateRegion, country)?.name ?? stateRegion,
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
      setSaved(true)
    } catch {
      setError('Could not save your profile. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm">
      <CardHeader className="border-b bg-muted/35 px-6 py-5">
        <CardTitle className="text-base">Professional profile</CardTitle>
        <CardDescription>Used to build relevant peer benchmarks. Your private details are never shown publicly.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Name</Label><div className="min-h-9 rounded-md border bg-muted/60 px-3 py-2 text-sm">{initialValues.full_name || '—'}</div></div>
            <div className="space-y-2"><Label>Email</Label><div className="min-h-9 truncate rounded-md border bg-muted/60 px-3 py-2 text-sm">{initialValues.email}</div></div>
          </div>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-2"><MapPin className="size-4 text-[var(--signal)]" /><h3 className="text-sm font-semibold">Location</h3></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="profile-country">Country</Label>
                <NativeSelect id="profile-country" aria-label="Country" value={country} required onChange={(e) => { setCountry(e.target.value); setStateRegion(''); setCity('') }}>
                  <NativeSelectOption value="">Select country</NativeSelectOption>
                  {Country.getAllCountries().map((item) => <NativeSelectOption key={item.isoCode} value={item.isoCode}>{item.name}</NativeSelectOption>)}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-state">State / Region</Label>
                <NativeSelect id="profile-state" aria-label="State or Region" value={stateRegion} disabled={!country} required onChange={(e) => { setStateRegion(e.target.value); setCity('') }}>
                  <NativeSelectOption value="">Select state / region</NativeSelectOption>
                  {states.map((item) => <NativeSelectOption key={item.isoCode} value={item.isoCode}>{item.name}</NativeSelectOption>)}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-city">City</Label>
                <NativeSelect id="profile-city" aria-label="City" value={city} disabled={!stateRegion} required onChange={(e) => setCity(e.target.value)}>
                  <NativeSelectOption value="">Select city</NativeSelectOption>
                  {cities.map((item) => <NativeSelectOption key={item.name} value={item.name}>{item.name}</NativeSelectOption>)}
                </NativeSelect>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <Label>Years of Experience</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {EXPERIENCE_OPTIONS.map((option) => {
                const id = `profile-experience-${option.replace(/\W+/g, '-').toLowerCase()}`
                return (
                  <Label key={option} htmlFor={id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 font-normal transition-colors hover:bg-accent/60 ${experience === option ? 'border-[var(--signal)] bg-accent/60' : 'bg-card'}`}>
                    <input id={id} type="radio" name="experience" value={option} checked={experience === option} onChange={() => setExperience(option)} aria-label={option} className="size-4 accent-[var(--signal)]" />{option}
                  </Label>
                )
              })}
            </div>
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-background">Tech / Non-Tech</Label>
              <NativeSelect id="profile-background" aria-label="Tech or Non-Tech" value={background} required onChange={(e) => setBackground(e.target.value)}>
                <NativeSelectOption value="">Select Tech / Non-Tech</NativeSelectOption>
                {BACKGROUND_OPTIONS.map((option) => <NativeSelectOption key={option} value={option}>{option}</NativeSelectOption>)}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-linkedin">LinkedIn Profile <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <div className="relative"><LinkIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="profile-linkedin" type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/yourname" className="pl-9" /></div>
            </div>
          </div>

          {error && <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
          {saved && <p role="status" className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" />Profile saved successfully!</p>}

          <div className="flex justify-end"><Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto"><Save />{loading ? 'Saving…' : 'Save Changes'}</Button></div>
        </form>
      </CardContent>
    </Card>
  )
}
