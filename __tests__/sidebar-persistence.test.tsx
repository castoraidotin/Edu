import { fireEvent, render, screen } from '@testing-library/react'
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar'

function SidebarStateProbe() {
  const { state, toggleSidebar } = useSidebar()
  return (
    <button type="button" data-state={state} onClick={toggleSidebar}>
      Toggle test sidebar
    </button>
  )
}

describe('SidebarProvider persistence', () => {
  it('keeps the sidebar collapsed when the provider remounts after navigation', () => {
    document.cookie = 'sidebar_state=; path=/; max-age=0'

    const firstRender = render(
      <SidebarProvider>
        <SidebarStateProbe />
      </SidebarProvider>
    )

    const firstToggle = screen.getByRole('button', { name: 'Toggle test sidebar' })
    fireEvent.click(firstToggle)
    expect(firstToggle).toHaveAttribute('data-state', 'collapsed')
    expect(document.cookie).toContain('sidebar_state=false')

    firstRender.unmount()

    render(
      <SidebarProvider>
        <SidebarStateProbe />
      </SidebarProvider>
    )

    expect(screen.getByRole('button', { name: 'Toggle test sidebar' })).toHaveAttribute(
      'data-state',
      'collapsed'
    )
  })
})
