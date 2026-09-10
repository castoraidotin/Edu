'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PromoSlide {
  title: string
  description: string
  action: string
  visual: string[]
}

const slides: PromoSlide[] = [
  {
    title: 'Equip your IT team to work confidently with AI',
    description: 'Practical workforce training that helps IT teams use modern AI tools confidently, consistently, and safely in their everyday work.',
    action: 'Learn more',
    visual: ['team.map(member =>', '  ai.enable(member)', ')', 'skills.filter(tool =>', '  useful_at_work', ')', 'ship_better_work()'],
  },
  {
    title: 'Automate the work slowing your business down',
    description: 'Custom software and automation designed around the processes your team already relies on, reducing repetitive work and operational effort.',
    action: 'Learn more',
    visual: ['manual_steps.filter(', '  step => repeatable', ')', 'workflow.map(task =>', '  remove_friction', ')', 'automate(workflow)'],
  },
]

export default function CastorPromoBanner() {
  const [activeSlide, setActiveSlide] = useState(0)
  const slide = slides[activeSlide]

  function showPrevious() {
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length)
  }

  function showNext() {
    setActiveSlide((current) => (current + 1) % slides.length)
  }

  return (
    <div className="mb-10">
      <div className="mb-2 flex h-7 items-center justify-end gap-1 text-muted-foreground">
        <span className="mr-2 font-mono text-xs tabular-nums text-foreground">
          {activeSlide + 1} of {slides.length}
        </span>
        <Button variant="ghost" size="icon-sm" onClick={showPrevious} aria-label="Previous Castor AI service">
          <ChevronLeft />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={showNext} aria-label="Next Castor AI service">
          <ChevronRight />
        </Button>
      </div>

      <section
        className="castor-promo relative min-h-[200px] overflow-hidden rounded-xl border text-foreground shadow-xs sm:h-[200px]"
        aria-live="polite"
      >
        <div
          aria-hidden="true"
          className="castor-promo-art absolute inset-y-0 right-0 hidden w-[55%] sm:block"
        />
        <div
          aria-hidden="true"
          className="castor-promo-blend absolute inset-y-0 left-[45%] hidden w-52 sm:block"
        />

        <div className="relative z-10 flex min-h-[200px] flex-col justify-center px-6 py-7 sm:h-[200px] sm:w-full sm:py-0 sm:pl-8 sm:pr-[40%]">
          <h2 className="w-fit text-[20px] font-medium leading-8 tracking-[-0.16px] text-foreground">
            {slide.title}
          </h2>
          <p className="mt-0 max-w-[666px] text-[14px] font-normal leading-5 text-muted-foreground">
            {slide.description}
          </p>
          <div className="mt-4">
            <Button asChild className="h-7 rounded-md bg-[#171717] px-2.5 text-[14px] font-medium leading-[14px] text-white shadow-none hover:bg-[#2a2a2a] dark:bg-white dark:text-[#171717] dark:hover:bg-[#e2e2e2]">
              <a href="https://castorai.in" target="_blank" rel="noreferrer">
                {slide.action}
              </a>
            </Button>
          </div>
        </div>

        <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-[48%] sm:block">
          <pre className="absolute -right-6 top-4 select-none font-mono text-[14px] leading-[1.08] tracking-[0.18em] text-white/75 lg:-right-2">
            {slide.visual.join('\n')}
          </pre>
          <span className="absolute right-[5.5%] top-1/2 flex size-16 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg ring-1 ring-black/5">
            <Image src="/icon.png" alt="" width={48} height={48} className="size-12 object-contain mix-blend-multiply" />
          </span>
        </div>
      </section>
    </div>
  )
}
