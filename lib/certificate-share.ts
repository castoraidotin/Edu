export const CERTIFICATE_TITLE = 'AI & Generative AI Assessment'
export const PUBLIC_SITE_URL = 'https://edu.castorai.in'

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
