import React from 'react'
import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { Question } from '@/types/onboarding'

type Props = {
  question: Question
  value: boolean | null
  onChange: (value: boolean) => void
}

export default function YesNoToggle({ question, value, onChange }: Props) {
  return (
    <div className="flex gap-4 w-full">
      <motion.button
        type="button"
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onChange(true)}
        className={`flex-1 py-4 rounded-2xl border-2 font-bold text-base transition-all flex items-center justify-center gap-2 ${
          value === true
            ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/10'
            : 'border-border/60 bg-card hover:bg-accent/40 text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icons.CheckCircle2 className="h-5 w-5" />
        Sí
      </motion.button>

      <motion.button
        type="button"
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onChange(false)}
        className={`flex-1 py-4 rounded-2xl border-2 font-bold text-base transition-all flex items-center justify-center gap-2 ${
          value === false
            ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/10'
            : 'border-border/60 bg-card hover:bg-accent/40 text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icons.XCircle className="h-5 w-5" />
        No
      </motion.button>
    </div>
  )
}
