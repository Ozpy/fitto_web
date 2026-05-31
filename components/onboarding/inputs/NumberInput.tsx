import React from 'react'
import { Question } from '@/types/onboarding'

type Props = {
  question: Question
  value: number | null
  onChange: (value: number) => void
}

export default function NumberInput({ question, value, onChange }: Props) {
  const unit = question.unit ?? ''
  const currentVal = value !== null && value !== undefined ? value : ''

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '') {
      onChange(0)
    } else {
      onChange(Number(val))
    }
  }

  return (
    <div className="relative flex items-center w-full">
      <input
        type="number"
        inputMode="decimal"
        value={currentVal}
        onChange={handleChange}
        placeholder="0"
        className="w-full bg-muted/40 border border-border/80 rounded-2xl py-4 px-5 text-xl font-bold text-foreground focus:outline-none focus:border-primary tracking-tight pr-16"
      />
      {unit && (
        <span className="absolute right-5 text-sm font-black text-muted-foreground uppercase tracking-wider select-none">
          {unit}
        </span>
      )}
    </div>
  )
}
