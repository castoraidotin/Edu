import type { ReactNode } from 'react'

interface AuthShellProps {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export default function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f5f2] px-4 py-12 sm:px-8">
      <section className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="mt-8">{children}</div>
        <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
      </section>
    </main>
  )
}
