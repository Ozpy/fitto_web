import React from 'react'
import * as Icons from 'lucide-react'
import { Question } from '@/types/onboarding'

type Props = {
  question: Question
  value: number | null
  onChange: (value: number) => void
}

function getDefaultValueForQuestion(slug: string, min: number, max: number): number {
  const s = slug.toLowerCase()
  if (s.includes('water')) return 2.5 // Average healthy water intake: 2.5 Liters
  if (s.includes('step')) return 8000 // Average active steps: 8000
  if (s.includes('sleep')) return 8 // Average ideal sleep: 8 hours
  if (s.includes('stress')) return 5 // Midpoint stress: 5
  if (s.includes('height')) return 170 // Average height: 170 cm
  if (s.includes('weight')) {
    if (s.includes('target')) return 70 // Default target weight: 70 kg
    return 75 // Default current weight: 75 kg
  }
  if (s.includes('caffeine')) return 2 // Average coffee: 2 cups
  if (s.includes('alcohol')) return 1 // Average alcohol: 1 drink
  if (s.includes('duration')) return 60 // Average workout duration: 60 minutes
  if (s.includes('days')) return 4 // Average active days: 4 days
  
  // Failsafe midpoint
  return Math.round((min + max) / 2)
}

function getStepValueForQuestion(slug: string): number {
  const s = slug.toLowerCase()
  if (s.includes('step')) return 1000 // 1,000 steps per click/step
  if (s.includes('water')) return 0.5 // 0.5 Liters per click/step
  if (s.includes('sleep')) return 0.5 // 0.5 hours per click/step
  if (s.includes('duration') || s.includes('minutes')) return 5 // 5 minutes per click/step
  return 1 // Default increment is 1
}

export default function NumberSlider({ question, value, onChange }: Props) {
  const min = question.validation_min ?? 0
  const max = question.validation_max ?? 100
  const unit = question.unit ?? ''
  
  const recommendedVal = getDefaultValueForQuestion(question.slug, min, max)
  const step = getStepValueForQuestion(question.slug)

  // Use the curated average instead of a blind midpoint!
  const currentVal = value ?? recommendedVal

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value))
  }

  const handleDecrement = () => {
    if (currentVal > min) {
      onChange(Number((currentVal - step).toFixed(1)))
    }
  }

  const handleIncrement = () => {
    if (currentVal < max) {
      onChange(Number((currentVal + step).toFixed(1)))
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full p-5 bg-muted/20 border border-border/40 rounded-3xl">
      {/* Large visual value */}
      <div className="flex items-center justify-between w-full">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={currentVal <= min}
          className="p-3.5 bg-card border border-border/80 rounded-2xl text-foreground hover:bg-accent/40 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm cursor-pointer"
        >
          <Icons.Minus className="h-5 w-5 stroke-[2.5]" />
        </button>

        <div className="text-center">
          <span className="text-4xl font-black text-foreground tabular-nums tracking-tight">
            {currentVal}
          </span>
          {unit && (
            <span className="text-sm font-bold text-muted-foreground ml-1.5 uppercase tracking-wide">
              {unit}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={currentVal >= max}
          className="p-3.5 bg-card border border-border/80 rounded-2xl text-foreground hover:bg-accent/40 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm cursor-pointer"
        >
          <Icons.Plus className="h-5 w-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Thick input range */}
      <div className="w-full flex flex-col gap-1.5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentVal}
          onChange={handleSliderChange}
          className="w-full h-3.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary border border-border/40"
        />
        <div className="flex justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
          <span>{min} {unit}</span>
          <span>{max} {unit}</span>
        </div>
      </div>

      {/* Premium UX: "No estoy seguro / Usar recomendado por IA" Selector */}
      <button
        type="button"
        onClick={() => onChange(recommendedVal)}
        className={`w-full py-3.5 px-4 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
          value === recommendedVal
            ? 'border-primary bg-primary/10 text-primary shadow-sm'
            : 'border-border/60 bg-card hover:bg-accent/40 text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icons.Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <span>No sé / Usar recomendado por IA ({recommendedVal} {unit})</span>
      </button>
    </div>
  )
}
