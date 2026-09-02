// Canonical option lists for the profile background and years-of-experience
// fields — the single source of truth shared by client-side dropdowns
// (profile edit form, complete-profile page, stats filters) and server-side
// validation (PATCH /api/profile). Keep this in sync everywhere these values
// are used so the server never rejects a value the UI just offered.
export const BACKGROUND_OPTIONS = ['Tech', 'Non-Tech'] as const

export const EXPERIENCE_OPTIONS: string[] = [
  'Fresher',
  '1-3 years',
  '3-5 years',
  '5-10 years',
  '10+ years',
]
