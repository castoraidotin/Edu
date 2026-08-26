import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-server'

export interface CertificateData {
  attemptId: string
  recipientName: string
  score: number
  completedAt: string
}
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function getCertificateData(attemptId: string): Promise<CertificateData | null> {
  if (!UUID_PATTERN.test(attemptId)) return null

  const { data: result, error } = await supabaseAdmin
    .from('test_results')
    .select('user_email, score, completed_at')
    .eq('quiz_attempt_id', attemptId)
    .eq('domain', 'ai')
    .maybeSingle()

  if (error || !result) return null

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
  }
}
