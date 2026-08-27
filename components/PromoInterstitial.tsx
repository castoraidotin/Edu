'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  PROMO_AD_TAG_LABEL,
  PROMO_BODY,
  PROMO_BRAND_NAME,
  PROMO_CONTINUE_DELAY_SECONDS,
  PROMO_CONTINUE_LABEL,
  PROMO_CTA_LABEL,
  PROMO_INTERSTITIAL_URL,
} from '@/lib/promo'
import { trackEvent } from '@/lib/analytics'

interface PromoInterstitialProps { onContinue: () => void }

export default function PromoInterstitial({ onContinue }: PromoInterstitialProps) {
  const [secondsLeft, setSecondsLeft] = useState(PROMO_CONTINUE_DELAY_SECONDS)
  const canContinue = secondsLeft <= 0

  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000)
    return () => clearTimeout(id)
  }, [secondsLeft])

  return (
    <Dialog open>
      <DialogContent data-testid="promo-interstitial" showCloseButton={false} className="max-w-sm shadow-2xl">
        <DialogHeader className="text-left">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">C</span>
            <span className="text-sm font-medium">{PROMO_BRAND_NAME}</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">{PROMO_AD_TAG_LABEL}</Badge>
          </div>
          <DialogTitle className="sr-only">Sponsored message</DialogTitle>
          <DialogDescription className="text-[15px] font-medium leading-relaxed text-foreground">{PROMO_BODY}</DialogDescription>
        </DialogHeader>
        <Button asChild size="lg"><a href={PROMO_INTERSTITIAL_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('cta_clicked', { location: 'quiz_interstitial', brand: 'castor' })}>{PROMO_CTA_LABEL}<ArrowRight /></a></Button>
        <Button variant="ghost" onClick={onContinue} disabled={!canContinue} className="w-full text-muted-foreground">
          {canContinue ? PROMO_CONTINUE_LABEL : `${PROMO_CONTINUE_LABEL} (${secondsLeft}s)`}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
