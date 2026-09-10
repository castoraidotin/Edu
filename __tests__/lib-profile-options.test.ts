import { BACKGROUND_OPTIONS, EXPERIENCE_OPTIONS } from '@/lib/profile-options'

describe('lib/profile-options', () => {
  it('BACKGROUND_OPTIONS contains only Tech and Non-Tech', () => {
    expect(BACKGROUND_OPTIONS).toEqual(['Tech', 'Non-Tech'])
  })

  it('EXPERIENCE_OPTIONS has exactly the 5 expected bands, in order', () => {
    expect(EXPERIENCE_OPTIONS).toEqual([
      'Fresher',
      '1-3 years',
      '3-5 years',
      '5-10 years',
      '10+ years',
    ])
  })
})
