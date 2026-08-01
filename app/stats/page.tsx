'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Country, State, City } from 'country-state-city'
import UserMenu from '@/components/UserMenu'
import AppHeader from '@/components/AppHeader'
import DomainOverview from '@/components/DomainOverview'
import Leaderboard from '@/components/Leaderboard'
import CommunityInsights from '@/components/stats/CommunityInsights'
import type { Domain } from '@/lib/types'
import { ALL_DOMAINS, DOMAIN_LABELS } from '@/lib/domains'
import { DESIGNATION_OPTIONS, EXPERIENCE_OPTIONS } from '@/lib/profile-options'
import { crowdFilterParams } from '@/lib/crowd-filter-params'
import type { PersonalStatsResponse, StatsResponse } from '@/lib/stats-types'
import { trackEvent } from '@/lib/analytics'
import { ArrowLeft, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TABS = [
  { id: 'performance', label: 'Community Insights' },
  { id: 'overview', label: 'Domain Overview' },
  { id: 'leaderboard', label: 'Leaderboard' },
] as const

type Tab = (typeof TABS)[number]['id']

function nameToCountryCode(name: string): string {
  if (!name) return ''
  return Country.getAllCountries().find((country) => country.name === name)?.isoCode ?? ''
}

function nameToStateCode(name: string, countryCode: string): string {
  if (!name || !countryCode) return ''
  return State.getStatesOfCountry(countryCode).find((state) => state.name === name)?.isoCode ?? ''
}

function StatsContent() {
  const searchParams = useSearchParams()
  const initialDomain = (searchParams?.get('domain') as Domain) || 'ai'

  const [tab, setTab] = useState<Tab>('performance')
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  const [domain, setDomain] = useState<Domain>(
    ALL_DOMAINS.includes(initialDomain) ? initialDomain : 'ai'
  )
  const [designation, setDesignation] = useState('all')
  const [experience, setExperience] = useState('all')
  const [countryCode, setCountryCode] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [city, setCity] = useState('')
  const [data, setData] = useState<StatsResponse | null>(null)
  const [personalData, setPersonalData] = useState<PersonalStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profileLocationReady, setProfileLocationReady] = useState(false)

  const states = countryCode ? State.getStatesOfCountry(countryCode) : []
  const cities = countryCode && stateCode ? City.getCitiesOfState(countryCode, stateCode) : []

  const countryName = countryCode ? Country.getCountryByCode(countryCode)?.name ?? '' : ''
  const stateName = stateCode ? State.getStateByCodeAndCountry(stateCode, countryCode)?.name ?? '' : ''

  // Fire stats_viewed once when the stats page mounts. Uses `domain` (the
  // sanitized state), not `initialDomain` (the raw query param), so an
  // invalid ?domain= value doesn't pollute analytics with a domain string
  // that was never actually valid or shown to the user.
  useEffect(() => {
    trackEvent('stats_viewed', { domain })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchProfileLocation() {
      try {
        const res = await fetch('/api/profile')
        if (!res.ok) return
        const json = await res.json()
        const profile = json.profile
        const initialCountryCode = nameToCountryCode(profile?.country ?? '')
        const initialStateCode = nameToStateCode(profile?.state_region ?? '', initialCountryCode)

        if (!cancelled && initialCountryCode) {
          setCountryCode(initialCountryCode)
          setStateCode(initialStateCode)
          setCity(profile?.city ?? '')
        }
      } catch {
        // Profile location is only a convenience default; broad stats should still load.
      } finally {
        if (!cancelled) setProfileLocationReady(true)
      }
    }

    fetchProfileLocation()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchStats() {
      if (!profileLocationReady) return
      try {
        setLoading(true)
        const params = new URLSearchParams({
          domain,
          ...crowdFilterParams({
            designation,
            experience,
            country: countryName || 'all',
            state_region: stateName || 'all',
            city: city || 'all',
          }),
        })
        const res = await fetch(`/api/stats?${params}`)
        if (!res.ok) throw new Error('Failed to load stats')
        const json = await res.json()
        if (cancelled) return
        setData(json)
        setError('')
      } catch {
        if (cancelled) return
        setError('Could not load stats. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchStats()
    return () => {
      cancelled = true
    }
  }, [domain, designation, experience, countryName, stateName, city, profileLocationReady])

  // The cross-domain "You, over time" and Domain Radar widgets need the
  // user's own activity across every domain, not just the one selected above,
  // so this is a separate fetch keyed on city/country rather than domain.
  useEffect(() => {
    let cancelled = false

    async function fetchPersonalStats() {
      if (!profileLocationReady) return
      try {
        const params = new URLSearchParams({
          domain,
          city: city || 'all',
          country: countryName || 'all',
        })
        const res = await fetch(`/api/stats/personal?${params}`)
        if (!res.ok) throw new Error('Failed to load personal stats')
        const json = await res.json()
        if (!cancelled) setPersonalData(json)
      } catch {
        if (!cancelled) setPersonalData(null)
      }
    }

    fetchPersonalStats()
    return () => {
      cancelled = true
    }
  }, [domain, city, countryName, profileLocationReady])

  const activeFilterCount = [countryCode, stateCode, city].filter((v) => v !== '').length
  const communityScope = city || stateName || countryName || 'everyone'
  const hasSpecificCommunity = communityScope !== 'everyone'
  const pageTitle = hasSpecificCommunity ? `${communityScope} Benchmark` : 'Community Insights'

  return (
    <main className="min-h-screen bg-background">
      <AppHeader right={<UserMenu />} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-6 text-muted-foreground">
          <Link href="/dashboard"><ArrowLeft /> Back to dashboard</Link>
        </Button>

        <div className="mb-7">
          <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-[0.18em]">Benchmark intelligence</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{pageTitle}</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
          See how many people are taking {DOMAIN_LABELS[domain]}, how they score, and where you stand.
          </p>
        </div>

        {/* Domain + Designation share a row so the chart doesn't get pushed below the fold */}
        <Card className="mb-6 gap-0 py-0 shadow-sm">
          <CardContent className="flex flex-wrap items-end gap-4 p-4 sm:p-5">
          <div className="w-full sm:flex-1 sm:min-w-[140px] sm:max-w-xs">
            <Label htmlFor="stats-domain" className="mb-2">Domain</Label>
            <NativeSelect
              id="stats-domain"
              aria-label="Domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value as Domain)}
            >
              {ALL_DOMAINS.map((d) => (
                <NativeSelectOption key={d} value={d}>
                  {DOMAIN_LABELS[d]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <div className="w-full sm:flex-1 sm:min-w-[140px] sm:max-w-xs">
            <Label htmlFor="stats-designation" className="mb-2">Designation</Label>
            <NativeSelect
              id="stats-designation"
              aria-label="Designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            >
              <NativeSelectOption value="all">All designations</NativeSelectOption>
              {DESIGNATION_OPTIONS.map((opt) => (
                <NativeSelectOption key={opt} value={opt}>
                  {opt}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <div className="w-full sm:flex-1 sm:min-w-[140px] sm:max-w-xs">
            <Label htmlFor="stats-experience" className="mb-2">Experience</Label>
            <NativeSelect
              id="stats-experience"
              aria-label="Experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              <NativeSelectOption value="all">All experience levels</NativeSelectOption>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <NativeSelectOption key={opt} value={opt}>
                  {opt}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <Button
            variant={showMoreFilters ? 'secondary' : 'outline'}
            size="icon-lg"
            onClick={() => setShowMoreFilters((v) => !v)}
            aria-label={showMoreFilters ? 'Hide filters' : 'More filters'}
            title={showMoreFilters ? 'Hide filters' : 'More filters'}
            className="relative shrink-0"
          >
            <SlidersHorizontal />
            {!showMoreFilters && activeFilterCount > 0 && (
              <span
                data-testid="filter-count-badge"
                className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
              >
                {activeFilterCount}
              </span>
            )}
          </Button>
          </CardContent>
        </Card>

        {showMoreFilters && (
          <Card
            className="mb-6 grid grid-cols-1 gap-4 p-4 shadow-sm sm:grid-cols-3"
            data-testid="more-filters"
          >
            <div>
              <Label htmlFor="stats-country" className="mb-2">Country</Label>
              <NativeSelect
                id="stats-country"
                aria-label="Country"
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value)
                  setStateCode('')
                  setCity('')
                }}
              >
                <NativeSelectOption value="">All countries</NativeSelectOption>
                {Country.getAllCountries().map((c) => (
                  <NativeSelectOption key={c.isoCode} value={c.isoCode}>
                    {c.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div>
              <Label htmlFor="stats-state" className="mb-2">State / Region</Label>
              <NativeSelect
                id="stats-state"
                aria-label="State or Region"
                value={stateCode}
                onChange={(e) => {
                  setStateCode(e.target.value)
                  setCity('')
                }}
                disabled={!countryCode}
              >
                <NativeSelectOption value="">All states / regions</NativeSelectOption>
                {states.map((s) => (
                  <NativeSelectOption key={s.isoCode} value={s.isoCode}>
                    {s.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div>
              <Label htmlFor="stats-city" className="mb-2">City</Label>
              <NativeSelect
                id="stats-city"
                aria-label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!stateCode}
              >
                <NativeSelectOption value="">All cities</NativeSelectOption>
                {cities.map((c) => (
                  <NativeSelectOption key={c.name} value={c.name}>
                    {c.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </Card>
        )}

        {/* Tabs — scrolls horizontally on narrow screens instead of overflowing
            the page, since the three labels don't fit ~340px-and-under widths.
            The right-edge mask fades the last tab into transparency instead of
            clipping it mid-word, so it reads as "swipe for more" rather than
            broken text. */}
        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="gap-6">
          <div className="overflow-x-auto border-b">
          <TabsList variant="line" className="h-11 min-w-max justify-start px-0">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                onClick={() => setTab(t.id)}
                className="h-11 flex-none px-4 data-[state=active]:text-primary after:bg-[var(--signal)]"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          </div>

        {/* Community Insights */}
        <TabsContent value="performance">
          <CommunityInsights
            domain={domain}
            loading={loading}
            error={error}
            stats={data}
            personal={personalData}
            communityScope={communityScope}
            hasSpecificCommunity={hasSpecificCommunity}
          />
        </TabsContent>

        {/* Domain Overview */}
        <TabsContent value="overview">
          <DomainOverview
            designation={designation}
            experience={experience}
            country={countryName || 'all'}
            state_region={stateName || 'all'}
            city={city || 'all'}
          />
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard">
          <div>
            <p className="mb-4 text-sm text-muted-foreground">Top scorers in {DOMAIN_LABELS[domain]}</p>
            <Card className="gap-0 py-0 shadow-sm"><CardContent className="p-4">
              <Leaderboard
                domain={domain}
                designation={designation}
                experience={experience}
                country={countryName || 'all'}
                state_region={stateName || 'all'}
                city={city || 'all'}
              />
            </CardContent></Card>
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <StatsContent />
    </Suspense>
  )
}

