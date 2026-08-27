import type { ReactNode } from 'react'
import { requireProductAccess } from '@/lib/product-access-server'

export default async function TestLayout({ children }: { children: ReactNode }) {
  await requireProductAccess()
  return children
}
