'use client'

import { useEffect, useState, Suspense } from 'react'
import DomainOverview from '@/components/DomainOverview'
import Leaderboard from '@/components/Leaderboard'
import CommunityInsights from '@/components/stats/CommunityInsights'
import DashboardShell from '@/components/dashboard/DashboardShell'
import type { Domain } from '@/lib/types'
import { DOMAIN_LABELS } from '@/lib/domains'
import { BACKGROUND_OPTIONS, EXPERIENCE_OPTIONS } from '@/lib/profile-options'
import { crowdFilterParams } from '@/lib/crowd-filter-params'
import type { PersonalStatsResponse, StatsResponse } from '@/lib/stats-types'
import { trackEvent } from '@/lib/analytics'
import { BarChart3, MapPin, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TABS = [
  { id: 'performance', label: 'Community Insights' },
  { id: 'overview', label: 'Domain Overview' },
  { id: 'leaderboard', label: 'Leaderboard' },
] as const

type Tab = (typeof TABS)[number]['id']

const LAUNCH_LOCATION = { country: 'India', stateRegion: 'Telangana', city: 'Hyderabad' } as const

function StatsContent() {
  const [tab, setTab] = useState<Tab>('performance')
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  const [domain, setDomain] = useState<Domain>('ai')
  const [designation, setDesignation] = useState('all')
  const [experience, setExperience] = useState('all')
  const [data, setData] = useState<StatsResponse | null>(null)
  const [personalData, setPersonalData] = useState<PersonalStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

    async function fetchStats() {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          domain,
          ...crowdFilterParams({
            designation,
            experience,
            country: LAUNCH_LOCATION.country,
            state_region: LAUNCH_LOCATION.stateRegion,
            city: LAUNCH_LOCATION.city,
          }),
          launch_city_only: 'true',
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
  }, [domain, designation, experience])

  // The cross-domain "You, over time" and Domain Radar widgets need the
  // user's own activity across every domain, not just the one selected above,
  // so this is a separate fetch keyed on city/country rather than domain.
  useEffect(() => {
    let cancelled = false

    async function fetchPersonalStats() {
      try {
        const params = new URLSearchParams({
          domain,
          city: LAUNCH_LOCATION.city,
          country: LAUNCH_LOCATION.country,
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
  }, [domain])

  const selectedFilterCount = (designation === 'all' ? 0 : 1)
    + (experience === 'all' ? 0 : 1)
  const communityScope = LAUNCH_LOCATION.city
  const hasSpecificCommunity = true
  const locationLabel = `${LAUNCH_LOCATION.city}, ${LAUNCH_LOCATION.stateRegion}, ${LAUNCH_LOCATION.country}`
  const cohortLabel = [
    designation === 'all' ? 'All backgrounds' : designation,
    experience === 'all' ? 'all experience levels' : experience,
  ].join(' · ')

  return (
    <DashboardShell activePath="/stats" title="Insights">
      <main className="mx-auto w-full max-w-[1532px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-[var(--signal-soft)] text-[var(--signal)]">
                <BarChart3 className="size-4" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Community insights</h1>
            </div>
            <p className="hidden">
              {DOMAIN_LABELS[domain]} <span aria-hidden="true">·</span> {cohortLabel}
            </p>
            <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
              <span className="truncate">{DOMAIN_LABELS[domain]}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{designation === 'all' ? 'All backgrounds' : designation} · {experience === 'all' ? 'all experience levels' : experience}</span>
            </p>
          </div>
          <Badge variant="outline" className="hidden h-8 w-fit max-w-72 gap-1.5 truncate bg-card px-3 font-normal text-muted-foreground shadow-xs sm:flex">
            <MapPin className="size-3.5 text-[var(--signal)]" /> {locationLabel}
          </Badge>
        </header>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground sm:hidden">
            <MapPin className="size-3.5 shrink-0 text-[var(--signal)]" />
            <span className="truncate">{locationLabel}</span>
          </div>

          <Sheet open={showMoreFilters} onOpenChange={setShowMoreFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" aria-label="More filters" className="ml-auto bg-card shadow-xs">
                <SlidersHorizontal />
                Filters
                {selectedFilterCount > 0 && (
                  <span data-testid="filter-count-badge" className="flex size-5 items-center justify-center rounded-full bg-[var(--signal-soft)] text-[10px] font-semibold text-[var(--signal)]">
                    {selectedFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>

            <SheetContent className="sm:max-w-md">
              <SheetHeader className="border-b px-5 py-5">
                <SheetTitle>Comparison filters</SheetTitle>
                <SheetDescription>Choose the peer group you want to compare with.</SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-1">
                <div>
                  <Label htmlFor="stats-domain" className="mb-2">Domain</Label>
                  <NativeSelect id="stats-domain" aria-label="Domain" value={domain} onChange={(e) => setDomain(e.target.value as Domain)}>
                    <NativeSelectOption value="ai">{DOMAIN_LABELS.ai}</NativeSelectOption>
                  </NativeSelect>
                </div>

                <div>
                  <Label htmlFor="stats-background" className="mb-2">Tech / Non-Tech</Label>
                  <NativeSelect id="stats-background" aria-label="Tech or Non-Tech" value={designation} onChange={(e) => setDesignation(e.target.value)}>
                    <NativeSelectOption value="all">All backgrounds</NativeSelectOption>
                    {BACKGROUND_OPTIONS.map((opt) => <NativeSelectOption key={opt} value={opt}>{opt}</NativeSelectOption>)}
                  </NativeSelect>
                </div>

                <div>
                  <Label htmlFor="stats-experience" className="mb-2">Experience</Label>
                  <NativeSelect id="stats-experience" aria-label="Experience" value={experience} onChange={(e) => setExperience(e.target.value)}>
                    <NativeSelectOption value="all">All experience levels</NativeSelectOption>
                    {EXPERIENCE_OPTIONS.map((opt) => <NativeSelectOption key={opt} value={opt}>{opt}</NativeSelectOption>)}
                  </NativeSelect>
                </div>

              </div>

              <SheetFooter className="border-t px-5 py-4">
                <SheetClose asChild><Button>View comparison</Button></SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Tabs — scrolls horizontally on narrow screens instead of overflowing
            the page, since the three labels don't fit ~340px-and-under widths.
            The right-edge mask fades the last tab into transparency instead of
            clipping it mid-word, so it reads as "swipe for more" rather than
            broken text. */}
        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="gap-4" id="benchmark-results">
          <div className="overflow-x-auto overflow-y-hidden border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList variant="line" className="h-9 min-w-max justify-start gap-5 px-0">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                onClick={() => setTab(t.id)}
                className="h-9 flex-none rounded-none px-1.5 text-xs font-medium after:bottom-0 after:bg-[var(--signal)] sm:text-sm"
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
            country={LAUNCH_LOCATION.country}
            state_region={LAUNCH_LOCATION.stateRegion}
            city={LAUNCH_LOCATION.city}
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
                country={LAUNCH_LOCATION.country}
                state_region={LAUNCH_LOCATION.stateRegion}
                city={LAUNCH_LOCATION.city}
              />
            </CardContent></Card>
          </div>
        </TabsContent>
        </Tabs>
      </main>
    </DashboardShell>
  )
}

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <StatsContent />
    </Suspense>
  )
}
