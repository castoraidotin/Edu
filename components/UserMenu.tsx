'use client'

import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowUpRight, BarChart3, Building2, ChevronDown, ChevronsUpDown, Code2, GraduationCap, LogOut, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserMenuProps {
  placement?: 'header' | 'sidebar'
}

export default function UserMenu({ placement = 'header' }: UserMenuProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const displayName = session?.user?.name?.split(' ')[0] ?? session?.user?.email ?? ''
  const fullName = session?.user?.name ?? 'Your account'
  const initial = (session?.user?.name ?? session?.user?.email ?? '?').charAt(0).toUpperCase()
  const isSidebar = placement === 'sidebar'

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={isSidebar
            ? 'min-h-16 w-full justify-start gap-3 rounded-xl p-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:min-h-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:p-0'
            : 'h-10 gap-2 px-2 data-[state=open]:bg-accent'}
          aria-label="User menu"
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => setOpen((value) => !value)}
        >
          <Avatar className="size-8 border border-background shadow-sm">
            <AvatarFallback className="bg-primary font-mono text-xs font-semibold text-primary-foreground">{initial}</AvatarFallback>
          </Avatar>
          {isSidebar ? (
            <>
              <span className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-sm font-medium">{fullName}</span>
                <span className="mt-0.5 block truncate text-xs font-normal text-sidebar-foreground/55">{session?.user?.email}</span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden" />
            </>
          ) : (
            <>
              <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">{displayName}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-testid="user-dropdown"
        align={isSidebar ? 'start' : 'end'}
        side={isSidebar ? 'top' : 'bottom'}
        sideOffset={8}
        className={isSidebar ? 'w-64 rounded-xl p-2 shadow-lg' : 'w-64 p-1.5 shadow-lg'}
      >
        <DropdownMenuLabel className={isSidebar ? 'px-3 py-3' : 'px-2 py-2'}>
          <p className="truncate text-sm font-semibold">{session?.user?.name ?? 'User'}</p>
          <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">{session?.user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={isSidebar ? 'h-14 rounded-lg px-3' : 'h-12 rounded-md px-2'}>
            <Building2 className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate font-medium">Castor AI</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">Organization</span>
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64 rounded-xl p-2 shadow-lg">
            <DropdownMenuLabel className="px-2 pb-2 pt-1 text-xs font-medium text-muted-foreground">
              Castor AI
            </DropdownMenuLabel>
            <DropdownMenuItem asChild className="h-12 gap-3 rounded-lg px-2">
              <a href="https://www.castorai.in/contact">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <GraduationCap className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">AI Workforce Training</span>
                <ArrowUpRight className="size-3.5 text-muted-foreground" />
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="h-12 gap-3 rounded-lg px-2">
              <a href="https://www.castorai.in/contact">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <Code2 className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">Software Solutions</span>
                <ArrowUpRight className="size-3.5 text-muted-foreground" />
              </a>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="space-y-0.5">
          <Button variant="ghost" className={isSidebar ? 'h-11 w-full justify-start px-3 font-normal' : 'w-full justify-start px-2 font-normal'} onClick={() => { setOpen(false); router.push('/profile') }}><UserRound />Profile</Button>
          <Button variant="ghost" className={isSidebar ? 'h-11 w-full justify-start px-3 font-normal' : 'w-full justify-start px-2 font-normal'} onClick={() => { setOpen(false); router.push('/stats') }}><BarChart3 />Stats</Button>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <Button variant="ghost" className={isSidebar ? 'h-11 w-full justify-start px-3 font-normal text-destructive hover:bg-destructive/10 hover:text-destructive' : 'w-full justify-start px-2 font-normal text-destructive hover:bg-destructive/10 hover:text-destructive'} onClick={() => signOut({ callbackUrl: '/' })}><LogOut />Sign out</Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
