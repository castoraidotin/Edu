'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import QuizTimer from '@/components/QuizTimer'
import QuizQuestion from '@/components/QuizQuestion'
import PromoInterstitial from '@/components/PromoInterstitial'
import PromoAdSlide from '@/components/PromoAdSlide'
import PromoBadge from '@/components/PromoBadge'
import ResultsScreen from '@/components/ResultsScreen'
import type { ClientQuestion, CorrectAnswer, Domain } from '@/lib/types'
import { ALL_DOMAINS as VALID_DOMAINS, DOMAIN_LABELS } from '@/lib/domains'
import { antiCheatHandlers } from '@/lib/anti-cheat'
import { trackEvent } from '@/lib/analytics'
import {
  PROMO_AD_SLIDE_ENABLED,
  PROMO_BADGE_ENABLED,
  PROMO_INTERSTITIAL_ENABLED,
  PROMO_SKIP_AD_LABEL,
  pickAdSlideTriggerIndex,
  pickInterstitialTriggerIndex,
} from '@/lib/promo'
import { ArrowLeft, ArrowRight, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

const TOTAL_SECONDS = 300 // 5 minutes

type Phase = 'loading' | 'quiz' | 'submitting' | 'results' | 'error'

export default function TestPage() {
  const params = useParams()
  const router = useRouter()
  const domain = params.domain as Domain
  const { data: session, status } = useSession()

  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<ClientQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, CorrectAnswer>>({})
  const [score, setScore] = useState<number | null>(null)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  // Bumped every time the user clicks "Try Again" on the results screen so a
  // same-domain retake (which doesn't change `domain`, `status`, or `router`)
  // still forces the data-fetching effect below to re-run and fully reset
  // questions/currentIndex/answers/score/attemptId/phase/errorMessage.
  const [resetKey, setResetKey] = useState(0)

  // Guards submitTest so it's a no-op after the first call — protects against
  // the timer firing its expire callback twice, or a manual Submit click
  // landing at nearly the same instant the timer expires.
  const hasSubmittedRef = useRef(false)

  // Mid-quiz Castor AI promo: shown once per attempt, at a randomized
  // question index re-rolled alongside hasSubmittedRef below so retakes get
  // a fresh (and unpredictable) trigger point each time.
  const [showInterstitial, setShowInterstitial] = useState(false)
  const interstitialShownRef = useRef(false)
  const interstitialTriggerRef = useRef(5)

  // In-quiz ad slide: same one-time, randomized-trigger shape as the
  // interstitial above, but rendered inline as if it were the next question
  // instead of a full-screen modal. Independent state/refs so either surface
  // can fire (or not) without the other knowing about it.
  const [showAdSlide, setShowAdSlide] = useState(false)
  const adSlideShownRef = useRef(false)
  const adSlideTriggerRef = useRef(5)

  // Client-side wall-clock start of the current attempt (captured once
  // questions are ready). Used with pausedDurationMsRef below to compute an
  // adjusted time_taken_seconds so the mid-quiz interstitial pause does not
  // leak into recorded quiz duration. A ref (not state) so nothing re-renders
  // on capture.
  const startTimeMsRef = useRef<number | null>(null)
  // Total time any promo pause (interstitial or ad slide) was actually open
  // across this attempt, in ms. Subtracted from wall-clock elapsed in the
  // submit body so a user's recorded quiz time reflects only time spent on
  // questions. Without this, the raw Date.now() - startTime math absorbs the
  // pause and inflates every attempt's recorded completion time (and can also
  // push wall-clock past the server's expires_at grace).
  const pausedDurationMsRef = useRef(0)
  // Timestamp of the currently-open interstitial (null when it isn't open).
  // Written on show, cleared on Continue; the delta between the two is added
  // to pausedDurationMsRef.
  const interstitialOpenedAtRef = useRef<number | null>(null)
  // Same as interstitialOpenedAtRef, but for the ad slide.
  const adSlideOpenedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return

    // Redirect invalid domains to dashboard
    if (!VALID_DOMAINS.includes(domain)) {
      router.push('/dashboard')
      return
    }

    // Fresh attempt: reset all per-attempt state before fetching. Guarded by
    // an async function (rather than calling setState directly in the effect
    // body) so this reset + fetch reads as a single synchronization to an
    // external system (the API), not a cascading-render anti-pattern.
    async function fetchQuestions() {
      hasSubmittedRef.current = false
      // Reset together with hasSubmittedRef above — both guard per-attempt
      // one-time behavior, so a future edit to one should touch the other.
      interstitialShownRef.current = false
      setShowInterstitial(false)
      adSlideShownRef.current = false
      setShowAdSlide(false)
      startTimeMsRef.current = null
      pausedDurationMsRef.current = 0
      interstitialOpenedAtRef.current = null
      adSlideOpenedAtRef.current = null
      setPhase('loading')
      setQuestions([])
      setCurrentIndex(0)
      setAnswers({})
      setScore(null)
      setCompletedAt(null)
      setAttemptId(null)
      setErrorMessage('')

      try {
        const res = await fetch(`/api/questions/${domain}`)
        if (!res.ok) throw new Error('Failed to load questions')
        const data = await res.json()
        if (!data.attemptId || !Array.isArray(data.questions) || data.questions.length !== 10) {
          throw new Error('Invalid quiz attempt')
        }
        interstitialTriggerRef.current = pickInterstitialTriggerIndex(data.questions.length)
        adSlideTriggerRef.current = pickAdSlideTriggerIndex(data.questions.length)
        setQuestions(data.questions)
        setAttemptId(data.attemptId)
        // Capture wall-clock start only after we have a usable attempt so the
        // recorded time doesn't include the initial fetch or any auth wait.
        startTimeMsRef.current = Date.now()
        setPhase('quiz')
        trackEvent('quiz_started', { domain })
      } catch {
        setErrorMessage('Could not load questions. Please try again.')
        setPhase('error')
      }
    }
    fetchQuestions()
  }, [domain, status, router, resetKey])

  const submitTest = useCallback(
    async (finalAnswers: Record<string, CorrectAnswer>) => {
      if (hasSubmittedRef.current) return
      hasSubmittedRef.current = true
      setPhase('submitting')
      if (!attemptId) throw new Error('Missing quiz attempt')
      // Wall-clock elapsed minus any interstitial-open time. Clamped to
      // [0, TOTAL_SECONDS]; server clamps to a wall-clock sanity window too.
      const startTimeMs = startTimeMsRef.current ?? Date.now()
      const elapsedMs = Date.now() - startTimeMs - pausedDurationMsRef.current
      const timeTakenSeconds = Math.max(
        0,
        Math.min(TOTAL_SECONDS, Math.round(elapsedMs / 1000))
      )
      try {
        const res = await fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain,
            attempt_id: attemptId,
            answers: finalAnswers,
            time_taken_seconds: timeTakenSeconds,
          }),
        })
        if (!res.ok) throw new Error('Failed to save results')
        const data = await res.json()
        const finalScore = typeof data.score === 'number' ? data.score : 0
        setScore(finalScore)
        setCompletedAt(new Date().toISOString())
        setPhase('results')
        trackEvent('quiz_completed', { domain, score: finalScore })
      } catch {
        setErrorMessage('Could not save results. Please try again.')
        setPhase('error')
      }
    },
    [attemptId, domain]
  )

  // Fire result_viewed once each time the results screen appears (including
  // retakes). The ref makes it fire on the transition into 'results', not on
  // every re-render while results are shown; it resets when we leave results
  // so a Try Again retake fires it again.
  const resultViewedRef = useRef(false)
  useEffect(() => {
    if (phase === 'results' && score !== null) {
      if (!resultViewedRef.current) {
        resultViewedRef.current = true
        trackEvent('result_viewed', { domain, score })
      }
    } else {
      resultViewedRef.current = false
    }
  }, [phase, score, domain])

  function handleTimerExpire() {
    submitTest(answers)
  }

  function handleTryAgain() {
    setResetKey((k) => k + 1)
    router.push(`/test/${domain}`)
  }

  function handleSelect(answer: CorrectAnswer) {
    setAnswers((prev) => ({ ...prev, [questions[currentIndex].id]: answer }))
  }

  function handleNext() {
    if (
      PROMO_INTERSTITIAL_ENABLED &&
      currentIndex === interstitialTriggerRef.current &&
      !interstitialShownRef.current
    ) {
      interstitialShownRef.current = true
      interstitialOpenedAtRef.current = Date.now()
      setShowInterstitial(true)
      return // Continue Quiz (handleInterstitialContinue) advances currentIndex, not this click
    }
    // Checked after the interstitial so that if both surfaces were ever
    // enabled at once and happened to share a trigger index, the interstitial
    // wins for that click — the ad slide's own index won't retrigger since
    // currentIndex will have already moved past it.
    if (
      PROMO_AD_SLIDE_ENABLED &&
      currentIndex === adSlideTriggerRef.current &&
      !adSlideShownRef.current
    ) {
      adSlideShownRef.current = true
      adSlideOpenedAtRef.current = Date.now()
      setShowAdSlide(true)
      return // Skip Ad (handleSkipAd) advances currentIndex, not this click
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      submitTest({ ...answers })
    }
  }

  function handleInterstitialContinue() {
    if (interstitialOpenedAtRef.current !== null) {
      pausedDurationMsRef.current += Date.now() - interstitialOpenedAtRef.current
      interstitialOpenedAtRef.current = null
    }
    setShowInterstitial(false)
    setCurrentIndex((i) => i + 1)
  }

  function handleSkipAd() {
    if (adSlideOpenedAtRef.current !== null) {
      pausedDurationMsRef.current += Date.now() - adSlideOpenedAtRef.current
      adSlideOpenedAtRef.current = null
    }
    setShowAdSlide(false)
    setCurrentIndex((i) => i + 1)
  }

  const currentQuestion = questions[currentIndex]
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] ?? null : null
  const isLastQuestion = currentIndex === questions.length - 1

  // Auth loading or redirecting
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 px-4"><Skeleton className="mx-auto h-5 w-32" /><Skeleton className="h-48 w-full" /></div>
      </main>
    )
  }

  // Loading questions
  if (phase === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 px-4"><Skeleton className="mx-auto h-5 w-40" /><Skeleton className="h-48 w-full" /></div>
      </main>
    )
  }

  // Error
  if (phase === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center"><CardContent className="p-6">
          <p className="mb-5 font-medium text-destructive">{errorMessage}</p>
          <Button
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft /> Back to dashboard
          </Button>
        </CardContent></Card>
      </main>
    )
  }

  // Results
  if (phase === 'results' && score !== null) {
    return (
      <ResultsScreen
        domain={domain}
        score={score}
        recipientName={session?.user?.name}
        attemptId={attemptId}
        completedAt={completedAt ?? undefined}
        onTryAgain={handleTryAgain}
      />
    )
  }

  // Submitting
  if (phase === 'submitting') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center"><div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-muted border-t-[var(--signal)]" /><p className="text-sm font-medium text-muted-foreground">Submitting your answers…</p></div>
      </main>
    )
  }

  // Quiz
  return (
    <main className="min-h-screen bg-background" {...antiCheatHandlers}>
      {/* Header bar */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold sm:inline">
              {DOMAIN_LABELS[domain]}
            </span>
            <Badge variant="secondary" className="font-mono text-xs">
              {currentIndex + 1} / {questions.length}
            </Badge>
          </div>
          <QuizTimer
            totalSeconds={TOTAL_SECONDS}
            onExpire={handleTimerExpire}
            paused={showInterstitial || showAdSlide}
          />
        </div>
        {PROMO_BADGE_ENABLED && (
          <div className="px-4 pb-1.5 flex justify-center sm:justify-end">
            <PromoBadge />
          </div>
        )}
      </div>

      {showInterstitial && <PromoInterstitial onContinue={handleInterstitialContinue} />}

      {/* Progress bar */}
      <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1 rounded-none bg-border [&_[data-slot=progress-indicator]]:bg-[var(--signal)]" />

      {/* Question card — lighter padding on phones so option text has more
          room to breathe before it wraps; unchanged from sm: up. */}
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <Card className="min-h-[560px] gap-0 py-0 shadow-sm"><CardContent className="flex min-h-[560px] flex-col p-5 sm:p-8">
          {showAdSlide ? (
            <>
              <PromoAdSlide />
              <div className="mt-8 flex justify-end">
                <Button
                  size="lg"
                  onClick={handleSkipAd}
                  className="w-full sm:w-auto"
                >
                  {PROMO_SKIP_AD_LABEL}
                </Button>
              </div>
            </>
          ) : (
            <>
              {currentQuestion && (
                <QuizQuestion
                  question={currentQuestion}
                  questionNumber={currentIndex + 1}
                  totalQuestions={questions.length}
                  selected={selectedAnswer}
                  onSelect={handleSelect}
                />
              )}

              <div className="mt-8 flex justify-end">
                <Button
                  size="lg"
                  onClick={handleNext}
                  disabled={!selectedAnswer}
                  className="w-full sm:w-auto"
                >
                  {isLastQuestion ? <><Send /> Submit test</> : <>Next question <ArrowRight /></>}
                </Button>
              </div>
            </>
          )}
        </CardContent></Card>
      </div>
    </main>
  )
}
