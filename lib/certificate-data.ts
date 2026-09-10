import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-server'
import type { CertificateSummary } from '@/lib/types'
import { latestResultsForDomain } from '@/lib/latest-results'
import { latestByKey } from '@/lib/latest-by-key'

export interface CertificateData {
  attemptId: string
  recipientName: string
  score: number
  completedAt: string
  topPercent: number | null
  cohortSize: number
  city: string
}
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface CertificateResultRow {
  id: string
  quiz_attempt_id: string | null
  score: number
  completed_at: string
}

async function getCertificateStanding(userEmail: string, certificateScore: number) {
  const { data, error } = await latestResultsForDomain('ai')
  if (error || !data) return { topPercent: null, cohortSize: 0, city: 'Hyderabad' }

  const latestByEmail = latestByKey(data, (result) => result.user_email)
  const emails = [...latestByEmail.keys()]
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('email, city')
    .in('email', emails)
  if (profilesError || !profiles) return { topPercent: null, cohortSize: 0, city: 'Hyderabad' }

  const cityByEmail = new Map(
    (profiles as Array<{ email: string; city: string | null }>).map((profile) => [profile.email, profile.city?.trim() || null]),
  )
  const city = cityByEmail.get(userEmail) || 'Hyderabad'
  const normalizedCity = city.toLocaleLowerCase('en-IN')
  const peerScores = [...latestByEmail.entries()]
    .filter(([email]) => email !== userEmail && cityByEmail.get(email)?.toLocaleLowerCase('en-IN') === normalizedCity)
    .map(([, result]) => result.score)
  const cohortScores = [...peerScores, certificateScore]
  const rank = cohortScores.filter((score) => score > certificateScore).length + 1

  return {
    topPercent: Math.max(1, Math.ceil((rank / cohortScores.length) * 100)),
    cohortSize: cohortScores.length,
    city,
  }
}

/**
 * Returns the one certificate-bearing result for a user: their earliest
 * completed AI assessment with an issued quiz attempt. Ordering by id after
 * completed_at makes the choice deterministic even if two rows share a
 * timestamp. No retake can update or replace this row.
 */
export async function getFirstCertificateForUser(
  userEmail: string,
): Promise<CertificateSummary | null> {
  const { data, error } = await supabaseAdmin
    .from('test_results')
    .select('id, quiz_attempt_id, score, completed_at')
    .eq('user_email', userEmail)
    .eq('domain', 'ai')
    .not('quiz_attempt_id', 'is', null)
    .order('completed_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  const result = data as CertificateResultRow | null
  if (error || !result?.quiz_attempt_id) return null

  const standing = await getCertificateStanding(userEmail, result.score)

  return {
    attemptId: result.quiz_attempt_id,
    score: result.score,
    completedAt: result.completed_at,
    ...standing,
  }
}

export async function getCertificateData(attemptId: string): Promise<CertificateData | null> {
  if (!UUID_PATTERN.test(attemptId)) return null

  const { data: result, error } = await supabaseAdmin
    .from('test_results')
    .select('user_email, score, completed_at')
    .eq('quiz_attempt_id', attemptId)
    .eq('domain', 'ai')
    .maybeSingle()

  if (error || !result) return null

  // Public certificate links are valid only for the first AI attempt. This
  // prevents an old retake URL from minting a second certificate with a
  // different score.
  const issuedCertificate = await getFirstCertificateForUser(result.user_email)
  if (!issuedCertificate || issuedCertificate.attemptId !== attemptId) return null

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('email', result.user_email)
    .maybeSingle()

  return {
    attemptId,
    recipientName: profile?.full_name?.trim() || 'AI learner',
    score: result.score,
    completedAt: result.completed_at,
    topPercent: issuedCertificate.topPercent ?? null,
    cohortSize: issuedCertificate.cohortSize ?? 0,
    city: issuedCertificate.city?.trim() || 'Hyderabad',
  }
}
