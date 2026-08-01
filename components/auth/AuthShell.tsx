import type { ReactNode } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthShellProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export default function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
      <section className="relative hidden overflow-hidden bg-[var(--action)] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,var(--signal)_0,transparent_34%),radial-gradient(circle_at_90%_80%,var(--signal)_0,transparent_30%)]" />
        <Link href="/" className="relative w-fit rounded-lg bg-white px-2 shadow-sm" aria-label="Edu by Castor AI home">
          <Logo />
        </Link>

        <div className="relative max-w-lg">
          <p className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
            Knowledge, measured clearly
          </p>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Know where you stand. See exactly where to grow.
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/65">
            Five practical technology benchmarks, personal progress, and peer insights in one focused workspace.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-5 border-t border-white/15 pt-6 font-mono text-xs text-white/55">
          <span><strong className="block text-lg text-white">10</strong>questions</span>
          <span><strong className="block text-lg text-white">5:00</strong>minutes</span>
          <span><strong className="block text-lg text-white">Instant</strong>benchmark</span>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-7 flex justify-center lg:hidden" aria-label="Edu by Castor AI home">
            <Logo />
          </Link>
          <Card className="gap-0 overflow-hidden py-0 shadow-lg shadow-slate-900/[0.04]">
            <CardHeader className="px-6 pb-6 pt-7 text-center sm:px-8 sm:pt-8">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--signal)]">{eyebrow}</p>
              <CardTitle className="mt-2 text-2xl tracking-tight"><h1>{title}</h1></CardTitle>
              <CardDescription className="leading-relaxed">{description}</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-7 sm:px-8 sm:pb-8">{children}</CardContent>
          </Card>
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </section>
    </main>
  )
}
