import { render } from '@testing-library/react'
import StatsShowcase from '@/components/home/StatsShowcase'

jest.mock('@/components/home/useSectionActive', () => ({
  useSectionActive: () => ({ ref: { current: null } }),
}))

describe('StatsShowcase', () => {
  it('keeps the ambient glow within the mobile page gutter', () => {
    const { container } = render(<StatsShowcase />)
    const glow = container.firstElementChild?.firstElementChild

    expect(glow).toHaveClass('-inset-6')
    expect(glow).toHaveClass('sm:-inset-14')
  })
})
