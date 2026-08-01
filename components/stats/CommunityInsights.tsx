'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Award,
  BarChart3,
  CalendarDays,
  Clock3,
  Compass,
  Flame,
  Gauge,
  MapPin,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Domain } from '@/lib/types'
import { ALL_DOMAINS, DOMAIN_LABELS, DOMAIN_LABELS_SHORT } from '@/lib/domains'
import { roundToOne } from '@/lib/stats-calculations'
import type { PersonalStatsResponse, StatsResponse } from '@/lib/stats-types'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function domainLabel(domain: string) {
  return DOMAIN_LABELS_SHORT[domain as Domain] ?? domain
}

function compactDomainLabel(domain: string) {
  const labels: Record<Domain, string> = {
    ai: 'AI',
    cloud: 'Cloud',
    cybersecurity: 'Cyber',
    devops: 'DevOps',
    data_science: 'Data',
  }
  return labels[domain as Domain] ?? domain
}

function formatChange(change: number | null) {
  if (change === null) return 'No prior score'
  if (change === 0) return 'No change'
  return `${change > 0 ? '+' : ''}${change.toFixed(1)} vs last`
}

function changeClass(change: number | null) {
  if (change === null || change === 0) return 'text-muted-foreground'
  return change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds % 60)
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

const tooltipStyle = {
  backgroundColor: 'var(--popover)',
  borderColor: 'var(--border)',
  borderRadius: '10px',
  color: 'var(--popover-foreground)',
  fontSize: '12px',
  boxShadow: '0 8px 24px rgb(0 0 0 / 0.08)',
}

function InsightCard({
  title,
  description,
  icon: Icon,
  action,
  testId,
  className = '',
  children,
}: {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  testId?: string
  className?: string
  children: ReactNode
}) {
  return (
    <Card className={`h-full min-w-0 gap-0 py-0 shadow-xs ${className}`} data-testid={testId}>
      <CardHeader className="gap-1 border-b px-4 py-3.5">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon className="size-4 shrink-0 text-[var(--signal)]" />
          )}
          <div className="min-w-0">
            <CardTitle className="text-sm">{title}</CardTitle>
            {description && <CardDescription className="mt-1 leading-5">{description}</CardDescription>}
          </div>
        </div>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className="min-w-0 p-4">{children}</CardContent>
    </Card>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed bg-muted/20 p-5 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div>
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-1.5 text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-right">{description}</p>
    </div>
  )
}

function MetricCard({
  label,
  value,
  suffix,
  helper,
  icon: Icon,
}: {
  label: string
  value: number | string
  suffix?: string
  helper: ReactNode
  icon: LucideIcon
}) {
  return (
    <Card className="gap-0 py-0 shadow-xs">
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon className="size-3.5 text-[var(--signal)]" />
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
          </div>
        </div>
        <p className="mt-2.5 font-mono text-xl font-semibold tracking-tight tabular-nums">
          {value}
          {suffix && <span className="ml-1 text-sm font-medium text-muted-foreground">{suffix}</span>}
        </p>
        <div className="mt-1.5 truncate text-[11px] text-muted-foreground">{helper}</div>
      </CardContent>
    </Card>
  )
}

function HeroRow({ stats }: { stats: StatsResponse }) {
  const progress = stats.userProgress
  return (
    <div className="grid grid-cols-2 gap-2.5 min-[480px]:grid-cols-3 min-[760px]:grid-cols-5" data-testid="hero-row">
      <MetricCard
        label="Tests taken"
        value={progress.attemptCount}
        helper="In the selected domain"
        icon={Activity}
      />
      <MetricCard
        label="Average score"
        value={progress.consistency.averageScore ?? '—'}
        suffix="/10"
        helper={<span className={changeClass(progress.scoreChange)}>{formatChange(progress.scoreChange)}</span>}
        icon={Gauge}
      />
      <MetricCard
        label="Best score"
        value={progress.bestScore ?? '—'}
        suffix="/10"
        helper={progress.latestScore !== null ? `Latest score ${progress.latestScore}/10` : 'Complete a test to begin'}
        icon={Award}
      />
      <MetricCard
        label="Percentile"
        value={stats.percentile ?? '—'}
        suffix={stats.percentile !== null ? '%' : undefined}
        helper={stats.yourRank !== null ? `Rank #${stats.yourRank} of ${stats.totalUsers}` : 'Waiting for enough peer data'}
        icon={Target}
      />
      <MetricCard
        label="Peer average"
        value={stats.averageScore ?? '—'}
        suffix="/10"
        helper={`${stats.totalUsers} ${stats.totalUsers === 1 ? 'test-taker' : 'test-takers'}`}
        icon={Users}
      />
    </div>
  )
}

function ScoreTrendCard({ personal }: { personal: PersonalStatsResponse }) {
  const points = personal.pacePoints.slice(-12)
  const data = points.map((point, index) => ({
    attempt: index + 1,
    score: point.score,
    date: formatDate(point.completedAt),
  }))

  return (
    <InsightCard
      title="Score trend"
      description="Your last 12 attempts across all domains"
      icon={TrendingUp}
      action={<Badge variant="outline">Score / 10</Badge>}
      testId="score-trend"
    >
      {data.length === 0 ? (
        <EmptyState>Your score history will appear after your first assessment.</EmptyState>
      ) : (
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--signal)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--signal)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="attempt" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis domain={[0, 10]} ticks={[0, 5, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <RechartsTooltip
                contentStyle={tooltipStyle}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                formatter={(value) => [`${value ?? 0}/10`, 'Score']}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="var(--signal)"
                fill="url(#scoreFill)"
                strokeWidth={2}
                activeDot={{ r: 4, fill: 'var(--signal)', stroke: 'var(--card)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </InsightCard>
  )
}

function ActivityCard({ stats, personal }: { stats: StatsResponse; personal: PersonalStatsResponse }) {
  const totalSeconds = personal.pacePoints.reduce((sum, point) => sum + point.timeTakenSeconds, 0)
  const attemptedDomains = new Set(personal.domainRanges.map((item) => item.domain)).size
  const progress = stats.userProgress
  const facts = [
    { label: 'Current streak', value: `${personal.streaks.currentStreak}d`, icon: Flame },
    { label: 'Time invested', value: formatDuration(totalSeconds), icon: Clock3 },
    { label: 'Domains covered', value: `${attemptedDomains}/${ALL_DOMAINS.length}`, icon: Compass },
    { label: 'Consistency', value: progress.consistency.label, icon: Activity },
  ]

  return (
    <InsightCard title="Your activity" description="A compact view of your learning rhythm" icon={CalendarDays} testId="activity-tile">
      <div className="grid grid-cols-2 gap-3" data-testid="domains-covered-tile">
        {facts.map((fact) => {
          const Icon = fact.icon
          return (
            <div key={fact.label} className="rounded-lg border bg-muted/20 p-3.5">
              <Icon className="size-4 text-muted-foreground" />
              <p className="mt-4 font-mono text-lg font-semibold tabular-nums">{fact.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{fact.label}</p>
            </div>
          )
        })}
      </div>
      {progress.averageTimePerQuestionSeconds !== null && (
        <p className="mt-4 border-t pt-4 text-xs text-muted-foreground" data-testid="this-domain-tile">
          About {progress.averageTimePerQuestionSeconds}s per question
          {progress.scorePerMinute !== null ? ` · ${progress.scorePerMinute} points per minute` : ''}
        </p>
      )}
    </InsightCard>
  )
}

function RecentAttemptsCard({ personal }: { personal: PersonalStatsResponse }) {
  const attempts = personal.recentAttempts.slice(0, 6)
  return (
    <InsightCard title="Recent attempts" description="Your latest results, newest first" icon={Clock3}>
      {attempts.length === 0 ? (
        <EmptyState>No attempts yet.</EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-0">Domain</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Date</TableHead>
              <TableHead className="pr-0 text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attempts.map((attempt, index) => (
              <TableRow key={`${attempt.domain}-${attempt.completedAt}-${index}`}>
                <TableCell className="max-w-44 truncate pl-0 font-medium">{domainLabel(attempt.domain)}</TableCell>
                <TableCell className="text-right font-mono font-semibold">{attempt.score}/10</TableCell>
                <TableCell className="hidden text-right text-muted-foreground sm:table-cell">{formatDate(attempt.completedAt)}</TableCell>
                <TableCell className={`pr-0 text-right font-mono text-xs ${changeClass(attempt.scoreChangeFromPrevious)}`}>
                  {attempt.scoreChangeFromPrevious === null
                    ? '—'
                    : `${attempt.scoreChangeFromPrevious > 0 ? '+' : ''}${attempt.scoreChangeFromPrevious}`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </InsightCard>
  )
}

function DomainComparisonCard({ personal }: { personal: PersonalStatsResponse }) {
  const data = personal.domainRadar.map((point) => ({
    domain: compactDomainLabel(point.domain),
    You: point.you ?? 0,
    City: point.city ?? 0,
    Country: point.country ?? 0,
  }))
  const hasData = personal.domainRadar.some((point) => point.you !== null || point.city !== null || point.country !== null)

  return (
    <InsightCard title="Across domains" description="You compared with city and country averages" icon={Compass} testId="domain-radar-tile">
      {!hasData ? (
        <EmptyState>Complete more domains to unlock this comparison.</EmptyState>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[var(--signal)]" />You</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[var(--chart-3)]" />City</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-muted-foreground/35" />Country</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" domain={[0, 10]} hide />
                <YAxis dataKey="domain" type="category" axisLine={false} tickLine={false} width={44} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <RechartsTooltip contentStyle={tooltipStyle} formatter={(value) => [`${value ?? 0}/10`]} />
                <Bar dataKey="You" fill="var(--signal)" radius={[0, 3, 3, 0]} />
                <Bar dataKey="City" fill="var(--chart-3)" radius={[0, 3, 3, 0]} />
                <Bar dataKey="Country" fill="color-mix(in srgb, var(--muted-foreground) 35%, transparent)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </InsightCard>
  )
}

function LearningPatternsCard({ personal }: { personal: PersonalStatsResponse }) {
  const bestWindow = [...personal.timeOfDayPerformance].sort(
    (a, b) => b.averageScore - a.averageScore || b.count - a.count
  )[0]
  const averageSeconds = personal.pacePoints.length > 0
    ? Math.round(personal.pacePoints.reduce((sum, point) => sum + point.timeTakenSeconds, 0) / personal.pacePoints.length)
    : null
  const averageScore = personal.pacePoints.length > 0
    ? roundToOne(personal.pacePoints.reduce((sum, point) => sum + point.score, 0) / personal.pacePoints.length)
    : null
  const mostConsistent = [...personal.domainRanges]
    .filter((range) => range.count > 1)
    .sort((a, b) => (a.max - a.min) - (b.max - b.min))[0]
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const hourLabel = bestWindow
    ? new Date(2026, 0, 1, bestWindow.hour).toLocaleTimeString([], { hour: 'numeric' })
    : null

  const patterns = [
    {
      label: 'Best testing window',
      value: bestWindow ? `${dayNames[bestWindow.dayOfWeek]}, ${hourLabel}` : 'Not enough data',
      detail: bestWindow ? `${bestWindow.averageScore}/10 average across ${bestWindow.count} ${bestWindow.count === 1 ? 'attempt' : 'attempts'}` : 'Keep testing to reveal your strongest time.',
      icon: CalendarDays,
      testId: 'when-you-test-best-tile',
    },
    {
      label: 'Average pace',
      value: averageSeconds === null ? 'Not enough data' : formatDuration(averageSeconds),
      detail: averageScore === null ? 'Complete an assessment to establish a baseline.' : `${averageScore}/10 average score at this pace`,
      icon: Gauge,
      testId: 'pace-vs-accuracy-tile',
    },
    {
      label: 'Most consistent domain',
      value: mostConsistent ? domainLabel(mostConsistent.domain) : 'Not enough data',
      detail: mostConsistent ? `${mostConsistent.min}–${mostConsistent.max} score range across ${mostConsistent.count} attempts` : 'Retake a domain to measure consistency.',
      icon: Activity,
      testId: 'consistency-band-tile',
    },
  ]

  return (
    <InsightCard title="Learning patterns" description="Three signals that can help you plan the next attempt" icon={Compass}>
      <div className="grid gap-3 md:grid-cols-3">
        {patterns.map((pattern) => {
          const Icon = pattern.icon
          return (
            <div key={pattern.label} className="rounded-lg border p-4" data-testid={pattern.testId}>
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" /></div>
              <p className="mt-4 text-xs text-muted-foreground">{pattern.label}</p>
              <p className="mt-1 text-sm font-semibold">{pattern.value}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{pattern.detail}</p>
            </div>
          )
        })}
      </div>
    </InsightCard>
  )
}

function ScoreDistributionCard({ stats }: { stats: StatsResponse }) {
  const data = stats.histogram.map((count, score) => ({ score: String(score), count, isYou: stats.yourScore === score }))
  return (
    <InsightCard
      title="Score distribution"
      description="How many people earned each score"
      icon={BarChart3}
      action={stats.yourScore !== null ? <Badge variant="outline">You: {stats.yourScore}/10</Badge> : undefined}
      testId="score-distribution-tile"
    >
      {stats.totalUsers === 0 ? (
        <EmptyState>There is not enough community data yet.</EmptyState>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="score" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <RechartsTooltip contentStyle={tooltipStyle} formatter={(value) => [value ?? 0, 'People']} labelFormatter={(label) => `Score ${label}/10`} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.score} fill={entry.isYou ? 'var(--signal)' : 'var(--muted-foreground)'} fillOpacity={entry.isYou ? 1 : 0.22} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </InsightCard>
  )
}

function CommunitySnapshotCard({ stats }: { stats: StatsResponse }) {
  const items = [
    { label: 'Test-takers', value: stats.totalUsers },
    { label: 'Average', value: stats.averageScore === null ? '—' : `${stats.averageScore}/10` },
    { label: 'Median', value: stats.medianScore === null ? '—' : `${stats.medianScore}/10` },
    { label: 'Most common', value: stats.modeScore === null ? '—' : `${stats.modeScore}/10` },
    { label: 'Top score', value: stats.topScore === null ? '—' : `${stats.topScore}/10` },
    { label: 'Lowest', value: stats.lowScore === null ? '—' : `${stats.lowScore}/10` },
  ]
  return (
    <InsightCard title="Community snapshot" description="The selected cohort at a glance" icon={Users} testId="community-snapshot-tile">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border">
        {items.map((item) => (
          <div key={item.label} className="bg-card p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>
      {stats.averageTimeSeconds !== null && (
        <p className="mt-4 text-xs text-muted-foreground">Average completion time: {formatDuration(stats.averageTimeSeconds)}</p>
      )}
    </InsightCard>
  )
}

function RankLadderCard({ stats, domain }: { stats: StatsResponse; domain: Domain }) {
  return (
    <InsightCard title="Your rank by scope" description={`Your position in ${DOMAIN_LABELS[domain]}`} icon={Target} testId="rank-ladder-tile">
      {stats.rankLadder.length === 0 ? (
        <EmptyState>Complete this assessment to see your rank.</EmptyState>
      ) : (
        <div className="divide-y rounded-lg border">
          {stats.rankLadder.map((rung) => (
            <div key={rung.scope} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{rung.scope}</p>
                <p className="mt-0.5 truncate text-sm font-medium">{rung.label}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold">{rung.averageScore ?? '—'}</p>
                <p className="text-[11px] text-muted-foreground">average</p>
              </div>
              <div className="min-w-16 text-right">
                <p className="font-mono text-sm font-semibold text-[var(--signal)]">{rung.rank === null ? '—' : `#${rung.rank}`}</p>
                <p className="text-[11px] text-muted-foreground">of {rung.cohortSize}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </InsightCard>
  )
}

function NeighborsCard({ stats }: { stats: StatsResponse }) {
  return (
    <InsightCard title="Around your rank" description="People immediately above and below you" icon={Users} testId="neighbors-tile">
      {stats.neighbors.length === 0 ? (
        <EmptyState>No nearby ranks to show yet.</EmptyState>
      ) : (
        <div className="space-y-2">
          {stats.neighbors.map((row) => (
            <div
              key={`${row.rank}-${row.name}`}
              className={`grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-3.5 py-3 ${row.isYou ? 'border-[var(--signal)]/35 bg-[var(--signal-soft)]/60' : 'bg-card'}`}
            >
              <span className="font-mono text-xs text-muted-foreground">#{row.rank}</span>
              <span className="truncate text-sm font-medium">{row.isYou ? 'You' : row.name}</span>
              <span className="font-mono text-sm font-semibold">{row.score}/10</span>
            </div>
          ))}
        </div>
      )}
    </InsightCard>
  )
}

function LocationComparisonCard({ stats }: { stats: StatsResponse }) {
  return (
    <InsightCard title="Performance by location" description="See how your score compares as the community widens" icon={MapPin} testId="location-comparison-tile">
      {stats.locationComparisons.length === 0 ? (
        <EmptyState>Location comparisons will appear when enough data is available.</EmptyState>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {stats.locationComparisons.map((item) => {
            const difference = stats.yourScore !== null && item.averageScore !== null
              ? roundToOne(stats.yourScore - item.averageScore)
              : null
            return (
              <div key={`${item.scope}-${item.label}`} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{item.scope}</p>
                    <p className="mt-1 truncate text-sm font-medium">{item.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-semibold">{item.averageScore ?? '—'}</p>
                    <p className={`text-xs ${changeClass(difference)}`}>{difference === null ? 'No comparison' : `${difference > 0 ? '+' : ''}${difference} you`}</p>
                  </div>
                </div>
                <Progress value={item.averageScore === null ? 0 : item.averageScore * 10} className="mt-4 h-1.5 bg-muted" />
                <p className="mt-2 text-xs text-muted-foreground">{item.count} test-takers</p>
              </div>
            )
          })}
        </div>
      )}
    </InsightCard>
  )
}

function PeerGroupsCard({ stats }: { stats: StatsResponse }) {
  const groups = stats.peerGroupRanks.filter((group) => group.rank !== null)
  return (
    <InsightCard title="Your peer groups" description="How you rank inside the groups most relevant to you" icon={Users} testId="peer-groups-tile">
      {groups.length === 0 ? (
        <EmptyState>There is not enough peer-group data yet.</EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <div key={group.dimension} className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">{group.dimension}</p>
              <p className="mt-1 truncate text-sm font-medium" title={group.label ?? undefined}>{group.label ?? 'Unknown'}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center">
                <div><p className="font-mono text-sm font-semibold">{stats.yourScore ?? '—'}</p><p className="mt-1 text-[11px] text-muted-foreground">You</p></div>
                <div><p className="font-mono text-sm font-semibold">{group.averageScore ?? '—'}</p><p className="mt-1 text-[11px] text-muted-foreground">Average</p></div>
                <div><p className="font-mono text-sm font-semibold text-[var(--signal)]">#{group.rank}</p><p className="mt-1 text-[11px] text-muted-foreground">of {group.cohortSize}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </InsightCard>
  )
}

function RankedList({
  items,
  valueLabel,
}: {
  items: StatsResponse['topCitiesByScore']
  valueLabel: 'score' | 'people'
}) {
  return (
    <div className="divide-y">
      {items.slice(0, 5).map((item) => (
        <div key={item.label} className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 py-3 first:pt-0 last:pb-0">
          <span className="font-mono text-xs text-muted-foreground">{item.rank}</span>
          <span className="truncate text-sm font-medium">{item.label}</span>
          <span className="font-mono text-sm font-semibold">{valueLabel === 'score' ? item.averageScore : item.count}</span>
        </div>
      ))}
    </div>
  )
}

function TopPlacesCard({ stats, kind }: { stats: StatsResponse; kind: 'states' | 'cities' }) {
  const scoreItems = kind === 'states' ? stats.averageScoreByState : stats.topCitiesByScore
  const activeItems = kind === 'states' ? stats.testTakersByState : stats.topCitiesByParticipation
  const title = kind === 'states' ? 'Top states' : 'Top cities'
  return (
    <InsightCard title={title} description="Highest average and most active communities" icon={MapPin} testId={kind === 'states' ? 'top-states-tile' : 'top-cities-tile'}>
      {scoreItems.length === 0 && activeItems.length === 0 ? (
        <EmptyState>There is not enough regional data yet.</EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <div><p className="mb-3 text-xs font-medium text-muted-foreground">Highest average</p><RankedList items={scoreItems} valueLabel="score" /></div>
          <div><p className="mb-3 text-xs font-medium text-muted-foreground">Most active</p><RankedList items={activeItems} valueLabel="people" /></div>
        </div>
      )}
    </InsightCard>
  )
}

interface CommunityInsightsProps {
  domain: Domain
  loading: boolean
  error: string
  stats: StatsResponse | null
  personal: PersonalStatsResponse | null
  communityScope: string
  hasSpecificCommunity: boolean
}

export default function CommunityInsights({
  domain,
  loading,
  error,
  stats,
  personal,
  communityScope,
  hasSpecificCommunity,
}: CommunityInsightsProps) {
  if (loading) {
    return (
      <div className="space-y-6" aria-label="Loading insights">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-32" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-12">
          <Skeleton className="h-96 lg:col-span-8" />
          <Skeleton className="h-96 lg:col-span-4" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 py-0 shadow-none">
        <CardContent className="p-5 text-sm text-destructive">{error}</CardContent>
      </Card>
    )
  }

  if (!stats || !personal) return null

  return (
    <div className="space-y-5" data-testid="community-insights">
      {stats.totalUsers === 0 && (
        <Card className="border-dashed bg-muted/20 py-0 shadow-none" data-testid="no-attempts-yet">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
            <Award className="size-4 shrink-0" />
            Nobody in {hasSpecificCommunity ? communityScope : 'this group'} has taken the {DOMAIN_LABELS[domain]} test yet — be the first!
          </CardContent>
        </Card>
      )}

      <HeroRow stats={stats} />

      <section className="grid gap-4 lg:grid-cols-12" aria-label="Personal performance">
        <div className="lg:col-span-12"><ScoreTrendCard personal={personal} /></div>
        <div className="lg:col-span-4"><ActivityCard stats={stats} personal={personal} /></div>
        <div className="lg:col-span-4"><RecentAttemptsCard personal={personal} /></div>
        <div className="lg:col-span-4"><DomainComparisonCard personal={personal} /></div>
        <div className="lg:col-span-12"><LearningPatternsCard personal={personal} /></div>
      </section>

      <section className="space-y-4 pt-2">
        <SectionHeading
          eyebrow="Community benchmark"
          title="Where you stand"
          description="These comparisons respond to the domain, role, experience, and location filters you selected."
        />
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7"><ScoreDistributionCard stats={stats} /></div>
          <div className="lg:col-span-5"><CommunitySnapshotCard stats={stats} /></div>
          <div className="lg:col-span-7"><RankLadderCard stats={stats} domain={domain} /></div>
          <div className="lg:col-span-5"><NeighborsCard stats={stats} /></div>
          <div className="lg:col-span-12"><LocationComparisonCard stats={stats} /></div>
          <div className="lg:col-span-12"><PeerGroupsCard stats={stats} /></div>
          <div className="lg:col-span-6"><TopPlacesCard stats={stats} kind="states" /></div>
          <div className="lg:col-span-6"><TopPlacesCard stats={stats} kind="cities" /></div>
        </div>
      </section>
    </div>
  )
}
