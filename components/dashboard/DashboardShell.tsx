'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Award, BarChart3, LayoutDashboard } from 'lucide-react'
import UserMenu from '@/components/UserMenu'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'

interface DashboardShellProps {
  children: ReactNode
  activePath?: '/dashboard' | '/stats' | '/certificates'
  title?: string
}

const navigation = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Insights', href: '/stats', icon: BarChart3 },
  { label: 'Certificates', href: '/certificates', icon: Award },
]

function SidebarBrand() {
  const { state } = useSidebar()

  return (
    <Link
      href="/"
      aria-label="Edu by Castor AI home"
      className={`flex h-14 w-full items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${state === 'collapsed' ? 'justify-center' : 'justify-start'}`}
    >
      {state === 'collapsed' ? (
        <Image
          src="/icon.png"
          alt=""
          width={40}
          height={40}
          className="size-10 object-contain mix-blend-multiply dark:invert dark:mix-blend-screen"
          priority
        />
      ) : (
        <span className="flex items-center gap-0.5 text-sidebar-foreground">
          <Image
            src="/icon.png"
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 object-contain mix-blend-multiply dark:invert dark:mix-blend-screen"
            priority
          />
          <span className="flex flex-col">
            <span className="font-serif text-[30px] leading-[0.78] tracking-[-0.04em]">Edu</span>
            <span className="mt-1 text-[10px] font-medium leading-none tracking-[-0.01em] text-sidebar-foreground/70">by Castor AI</span>
          </span>
        </span>
      )}
    </Link>
  )
}

export default function DashboardShell({
  children,
  activePath = '/dashboard',
  title = 'Dashboard',
}: DashboardShellProps) {
  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border p-1">
          <SidebarBrand />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="pt-4">
            <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.16em]">Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton asChild isActive={item.href === activePath} tooltip={item.label} className="h-9">
                        <Link href={item.href}><Icon /><span>{item.label}</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-1">
          <UserMenu placement="sidebar" />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 overflow-hidden dark:bg-[#212121]">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b bg-card/90 px-4 backdrop-blur-md dark:bg-[#212121]/95 sm:px-5">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-3 h-4" />
          <p className="text-sm font-medium">{title}</p>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
