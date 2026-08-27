'use client'

import type { ClientQuestion, CorrectAnswer } from '@/lib/types'
import { NO_SELECT_STYLE } from '@/lib/anti-cheat'
import { Button } from '@/components/ui/button'

interface QuizQuestionProps {
  question: ClientQuestion
  questionNumber: number
  totalQuestions: number
  selected: CorrectAnswer | null
  onSelect: (answer: CorrectAnswer) => void
}

const OPTIONS: { key: CorrectAnswer; label: string }[] = [
  { key: 'A', label: 'option_a' },
  { key: 'B', label: 'option_b' },
  { key: 'C', label: 'option_c' },
  { key: 'D', label: 'option_d' },
]

export default function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  selected,
  onSelect,
}: QuizQuestionProps) {
  return (
    <div className="select-none">
      {/* Progress */}
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--ink-soft)] mb-3">
        Question {questionNumber} of {totalQuestions}
      </p>

      {/* Question text — no copy */}
      <p
        className="text-lg font-semibold text-[var(--ink)] mb-6 leading-relaxed"
        style={NO_SELECT_STYLE}
      >
        {question.question}
      </p>

      {/* Options */}
      <div className="space-y-3">
        {OPTIONS.map(({ key, label }) => {
          const optionText = question[label as keyof ClientQuestion] as string
          const isSelected = selected === key

          return (
            <Button
              key={key}
              type="button"
              variant="outline"
              onClick={() => onSelect(key)}
              className={`group h-auto min-h-16 w-full justify-start gap-4 whitespace-normal rounded-lg border-2 px-5 py-4 text-left shadow-none transition-all ${
                isSelected
                  ? 'border-blue-500 bg-accent text-foreground hover:bg-accent hover:text-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/40 hover:text-foreground'
              }`}
              style={{ ...NO_SELECT_STYLE, borderColor: isSelected ? 'var(--signal)' : undefined }}
            >
              {/* Letter label — always visible */}
              <span
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm ${
                  isSelected
                    ? 'bg-[var(--signal)] text-white'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground'
                }`}
              >
                {key}
              </span>

              {/* Option text — hidden until hover or selected */}
              <span
                className={`text-[var(--ink)] text-sm transition-all duration-200 ${
                  isSelected
                    ? 'opacity-100'
                    : '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100'
                }`}
                style={NO_SELECT_STYLE}
                aria-label={`Option ${key}: ${optionText}`}
              >
                {optionText}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
