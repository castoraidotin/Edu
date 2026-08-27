import type { ReactNode } from 'react'
import { requireProductAccess } from '@/lib/product-access-server'

export default async function StatsLayout({ children }: { children: ReactNode }) {
  await requireProductAccess()
  return children
}
