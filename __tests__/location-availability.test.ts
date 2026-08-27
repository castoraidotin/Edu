import { isLaunchCity, locationDisplayLabel } from '@/lib/location-availability'

describe('location availability', () => {
  it('treats Hyderabad as available without depending on casing or whitespace', () => {
    expect(isLaunchCity('Hyderabad')).toBe(true)
    expect(isLaunchCity('  HYDERABAD ')).toBe(true)
  })

  it('keeps other and missing cities behind the availability gate', () => {
    expect(isLaunchCity('Warangal')).toBe(false)
    expect(isLaunchCity('Bengaluru')).toBe(false)
    expect(isLaunchCity(null)).toBe(false)
  })

  it('formats the selected location for the coming-soon page', () => {
    expect(locationDisplayLabel({ city: 'Warangal', stateRegion: 'Telangana', country: 'India' }))
      .toBe('Warangal, Telangana, India')
  })
})
