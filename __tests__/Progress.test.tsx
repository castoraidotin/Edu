import { render, screen } from '@testing-library/react'
import { Progress } from '@/components/ui/progress'

it.each([0, 40, 100])('exposes %s percent to assistive technology', (value) => {
  render(<Progress value={value} aria-label="Profile readiness" />)
  expect(screen.getByRole('progressbar', { name: 'Profile readiness' })).toHaveAttribute('aria-valuenow', String(value))
})
