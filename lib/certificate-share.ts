export const CERTIFICATE_TITLE = 'AI & Generative AI Assessment'
export const PUBLIC_SITE_URL = 'https://edu.castorai.in'

// The on-page certificate and social preview share this formatter so the
// holder's standing is stated consistently everywhere.
export function certificateAchievementText(topPercent?: number | null) {
  const safeTopPercent =
    typeof topPercent === 'number' && Number.isFinite(topPercent)
      ? Math.min(100, Math.max(1, Math.round(topPercent)))
      : 100

  return `For completing the “Artificial Intelligence & Generative AI” assessment and ranking among the top ${safeTopPercent}% of all test-takers.`
}

export const CERTIFICATE_SHARE_TEXT = [
  'I’m excited to share that I completed the Artificial Intelligence & Generative AI assessment by Castor AI.',
  '',
  'Take the assessment to discover how effectively you can use AI in your workflows.',
  '',
  'Edu: edu.castorai.in',
].join('\n')

export function certificateShareUrl(attemptId?: string | null) {
  return attemptId
    ? `${PUBLIC_SITE_URL}/certificate/${encodeURIComponent(attemptId)}`
    : PUBLIC_SITE_URL
}
