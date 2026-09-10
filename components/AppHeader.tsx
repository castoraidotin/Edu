// Shared console chrome for every authenticated page — a slim, hairline-bordered
// bar with the wordmark on the left and a slot (usually UserMenu) on the right.
// Consistent across dashboard, profile, stats, and the quiz flow.

import type { ReactNode } from 'react'
import Logo from '@/components/Logo'

interface AppHeaderProps {
  center?: ReactNode
  right?: ReactNode
  sticky?: boolean
}

export default function AppHeader({ center, right, sticky }: AppHeaderProps) {
  return (
    <header className={`${sticky ? 'sticky top-0 z-20' : ''} border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
        <Logo />
        {center && <div className="ml-10 hidden items-center md:flex">{center}</div>}
        <div className="ml-auto">{right}</div>
      </div>
    </header>
  )
}
