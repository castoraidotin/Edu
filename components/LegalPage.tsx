import Link from 'next/link'
import type { ReactNode } from 'react'
import Logo from '@/components/Logo'

type LegalSection = {
  title: string
  content: ReactNode
}

type LegalPageProps = {
  title: string
  summary: string
  sections: LegalSection[]
}

export default function LegalPage({ title, summary, sections }: LegalPageProps) {
  return (
    <div className="landing-light min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link href="/" aria-label="Edu home">
            <Logo />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-[var(--action)] transition-colors hover:text-[var(--action-hover)]"
          >
            Back to Edu
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--signal)]">
          Edu by Castor AI
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">{summary}</p>
        <p className="mt-4 font-mono text-xs uppercase tracking-wide text-[var(--ink-soft)]">
          Effective September 14, 2026
        </p>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-semibold tracking-tight">{section.title}</h2>
              <div className="mt-3 space-y-3 leading-7 text-[var(--ink-soft)] [&_a]:font-medium [&_a]:text-[var(--action)] [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-[var(--line)] bg-[var(--surface)] px-5 py-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 text-sm text-[var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Castor AI. All rights reserved.</p>
          <nav className="flex gap-5" aria-label="Legal">
            <Link className="hover:text-[var(--ink)]" href="/privacy">Privacy</Link>
            <Link className="hover:text-[var(--ink)]" href="/terms">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
