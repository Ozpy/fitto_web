import React from 'react'
import { motion } from 'framer-motion'
import { Question } from '@/types/onboarding'

type Props = {
  question: Question
  value: string | null
  onChange: (value: string) => void
}

export default function SingleSelectPills({ question, value, onChange }: Props) {
  const options = question.options || []

  return (
    <div className="flex flex-wrap gap-2.5 w-full">
      {options.map((option) => {
        const isSelected = String(value) === String(option.value)

        return (
          <motion.button
            key={option.id}
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(option.value)}
            className={`px-5 py-3 rounded-full border-2 text-sm font-semibold transition-all ${
              isSelected
                ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/10'
                : 'border-border/60 bg-card hover:bg-accent/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            {option.label}
          </motion.button>
        )
      })}
    </div>
  )
}
