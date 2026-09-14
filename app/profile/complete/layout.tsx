import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getProductAccessState } from '@/lib/product-access-server'

export default async function CompleteProfileLayout({ children }: { children: ReactNode }) {
  const access = await getProductAccessState()

  if (access.status === 'signed-out') redirect('/login')
  if (access.status === 'available') redirect('/dashboard')

  return children
}
