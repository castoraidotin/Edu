'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BrainCircuit,
  ChartNoAxesCombined,
  Check,
  Clock3,
  Cloud,
  HelpCircle,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Domain } from '@/lib/types'
import { ALL_DOMAINS, DOMAIN_LABELS } from '@/lib/domains'
import { trackEvent } from '@/lib/analytics'

const DOMAIN_DESCRIPTIONS: Record<Domain, string> = {
  ai: 'Prompting, model behavior, LLM APIs, and responsible AI fundamentals.',
  cloud: 'Core services, architecture patterns, reliability, and cloud economics.',
  cybersecurity: 'Threats, identity, network defense, protocols, and security practice.',
  devops: 'Delivery pipelines, containers, Kubernetes, automation, and observability.',
  data_science: 'Machine learning, SQL, data pipelines, analytics, and visualization.',
}

const DOMAIN_ICONS: Record<Domain, LucideIcon> = {
  ai: BrainCircuit,
  cloud: Cloud,
  cybersecurity: ShieldCheck,
  devops: Workflow,
  data_science: ChartNoAxesCombined,
}

const AVAILABLE_DOMAINS = new Set<Domain>(['ai'])

const DOMAINS = ALL_DOMAINS.map((id, index) => ({
  id,
  index: index + 1,
  name: DOMAIN_LABELS[id],
  description: DOMAIN_DESCRIPTIONS[id],
  icon: DOMAIN_ICONS[id],
}))

export default function DomainSelector() {
  const router = useRouter()
  const [selected, setSelected] = useState<Domain | null>(null)
  const selectedDomain = DOMAINS.find((domain) => domain.id === selected)
  const SelectedIcon = selectedDomain?.icon

  function handleConfirm() {
    if (!selected || !AVAILABLE_DOMAINS.has(selected)) return
    trackEvent('domain_selected', { domain: selected })
    router.push(`/test/${selected}`)
  }

  return (
    <>
      <div className="grid gap-3">
        {DOMAINS.map((domain) => {
          const Icon = domain.icon
          const isAvailable = AVAILABLE_DOMAINS.has(domain.id)
          const cardContent = (
            <CardContent className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-4 sm:gap-5 sm:p-5">
              <span
                className={isAvailable
                  ? 'flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--signal-soft)] text-[var(--signal)] transition-colors group-hover:bg-[var(--signal)] group-hover:text-white'
                  : 'flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground/55 blur-[1px]'}
              >
                <Icon className="size-5" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] font-semibold text-muted-foreground">{String(domain.index).padStart(2, '0')}</span>
                  <h3 className="text-[15px] font-semibold leading-5 text-foreground">{domain.name}</h3>
                </div>
                <p className={isAvailable
                  ? 'mt-1.5 text-[13px] font-normal leading-5 text-muted-foreground sm:truncate'
                  : 'mt-1.5 select-none text-[13px] font-normal leading-5 text-muted-foreground opacity-40 blur-[1.5px] sm:truncate'}
                >
                  {domain.description}
                </p>
              </div>
              {isAvailable ? (
                <div className="flex items-center gap-3 pl-2">
                  <span className="hidden text-right font-mono text-[10px] font-medium uppercase leading-4 tracking-wide text-muted-foreground sm:block">5 min<br />10 questions</span>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-foreground transition-colors group-hover:border-[var(--action)] group-hover:bg-[var(--action)] group-hover:text-white">
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              ) : (
                <Badge variant="secondary" className="shrink-0 px-2.5 py-1 text-[10px] uppercase tracking-wide">
                  Coming soon
                </Badge>
              )}
            </CardContent>
          )

          if (!isAvailable) {
            return (
              <Card
                key={domain.id}
                aria-disabled="true"
                data-testid={`coming-soon-${domain.id}`}
                className="relative gap-0 overflow-hidden border-dashed bg-card/65 py-0 shadow-xs"
              >
                {cardContent}
              </Card>
            )
          }

          return (
            <Card
              key={domain.id}
              className="group relative gap-0 overflow-hidden py-0 shadow-sm transition-colors hover:border-[var(--signal)]/35 hover:bg-card"
            >
              <Button
                variant="ghost"
                onClick={() => setSelected(domain.id)}
                aria-label={`Select ${domain.name} assessment`}
                className="h-full min-h-24 w-full items-stretch justify-start whitespace-normal rounded-xl p-0 text-left hover:bg-muted/35"
              >
                {cardContent}
              </Button>
            </Card>
          )
        })}
      </div>

      <Dialog open={Boolean(selectedDomain)} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <div className="relative overflow-hidden bg-[var(--action)] px-6 pb-6 pt-7 text-white">
            <div className="absolute -right-10 -top-16 size-44 rounded-full bg-[var(--signal)]/25 blur-3xl" />
            <DialogHeader className="relative text-left">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                  {SelectedIcon && <SelectedIcon className="size-5 text-white/75" />}
                </span>
                <Badge className="border-white/15 bg-white/10 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-white/10">Assessment brief</Badge>
              </div>
              <DialogTitle className="text-2xl tracking-tight text-white">Ready to start?</DialogTitle>
              <DialogDescription className="pt-1 text-base font-medium text-white/70">
                {selectedDomain?.name}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-3 gap-3">
              <Card className="gap-0 bg-muted/55 py-0 shadow-none">
                <CardContent className="p-3 text-center">
                  <HelpCircle className="mx-auto mb-2 size-4 text-[var(--signal)]" />
                  <strong className="block font-mono text-base">10</strong>
                  <span className="text-[11px] text-muted-foreground">Questions</span>
                </CardContent>
              </Card>
              <Card className="gap-0 bg-muted/55 py-0 shadow-none">
                <CardContent className="p-3 text-center">
                  <Clock3 className="mx-auto mb-2 size-4 text-[var(--signal)]" />
                  <strong className="block font-mono text-base">5:00</strong>
                  <span className="text-[11px] text-muted-foreground">Time limit</span>
                </CardContent>
              </Card>
              <Card className="gap-0 bg-muted/55 py-0 shadow-none">
                <CardContent className="p-3 text-center">
                  <Check className="mx-auto mb-2 size-4 text-[var(--signal)]" />
                  <strong className="block font-mono text-base">Live</strong>
                  <span className="text-[11px] text-muted-foreground">Session</span>
                </CardContent>
              </Card>
            </div>
            <p className="sr-only">10 questions · 5 minute timer · Cannot pause</p>

            <div className="my-5 rounded-xl border bg-background p-4">
              <p className="text-sm font-semibold">Before you begin</p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                The timer starts immediately. Work in one sitting—the assessment cannot be paused once it begins.
              </p>
            </div>

            <DialogFooter className="grid grid-cols-2 sm:grid-cols-2">
              <Button variant="outline" size="lg" onClick={() => setSelected(null)}>Cancel</Button>
              <Button size="lg" onClick={handleConfirm}>Start Test <ArrowRight /></Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
