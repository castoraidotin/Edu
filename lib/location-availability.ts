export const LAUNCH_CITY = 'Hyderabad'

function normalizePlace(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase('en-IN') ?? ''
}

export function isLaunchCity(city: string | null | undefined) {
  return normalizePlace(city) === normalizePlace(LAUNCH_CITY)
}

export function locationDisplayLabel({
  city,
  stateRegion,
  country,
}: {
  city?: string | null
  stateRegion?: string | null
  country?: string | null
}) {
  return [city, stateRegion, country].filter(Boolean).join(', ') || 'Your location'
}
