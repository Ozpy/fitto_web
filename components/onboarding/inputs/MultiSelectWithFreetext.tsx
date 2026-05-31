import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Icons from 'lucide-react'
import { Question } from '@/types/onboarding'

type Props = {
  question: Question
  value: string[] | null
  onChange: (value: string[]) => void
}

export default function MultiSelectWithFreetext({ question, value = [], onChange }: Props) {
  const options = question.options || []
  const currentSelections = value || []
  const [customText, setCustomText] = useState('')

  const toggleSelection = (val: string) => {
    if (currentSelections.includes(val)) {
      onChange(currentSelections.filter((item) => item !== val))
    } else {
      onChange([...currentSelections, val])
    }
  }

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = customText.trim()
    if (!trimmed) return

    // Prevent duplicates
    if (!currentSelections.includes(trimmed)) {
      onChange([...currentSelections, trimmed])
    }
    setCustomText('')
  }

  // Predefined values to help identify custom ones
  const predefinedValues = options.map((o) => o.value)

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Selected tags */}
      {currentSelections.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2.5 bg-muted/50 rounded-2xl border border-border/40">
          <AnimatePresence>
            {currentSelections.map((val) => {
              const opt = options.find((o) => o.value === val)
              const isCustom = !predefinedValues.includes(val)

              return (
                <motion.span
                  key={val}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm"
                >
                  {opt ? opt.label : val}
                  {isCustom && (
                    <span className="text-[9px] bg-primary-foreground/20 text-primary-foreground px-1.5 py-0.5 rounded-full font-bold uppercase">
                      personalizado
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleSelection(val)}
                    className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                  >
                    <Icons.X className="h-3 w-3" />
                  </button>
                </motion.span>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Grid of predefined common options */}
      <div className="grid grid-cols-2 gap-2.5 w-full">
        {options.map((option) => {
          const isSelected = currentSelections.includes(option.value)

          return (
            <motion.button
              key={option.id}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleSelection(option.value)}
              className={`p-3.5 rounded-2xl border-2 text-sm font-semibold transition-all text-left flex items-center justify-between ${
                isSelected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border/60 bg-card hover:bg-accent/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              {option.label}
              {isSelected && (
                <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                  <Icons.Check className="h-3 w-3 stroke-[3]" />
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Form at bottom to add custom options */}
      <form onSubmit={handleAddCustom} className="flex gap-2 w-full mt-2">
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="¿Otro? Escríbelo aquí..."
          className="flex-1 bg-muted/40 border border-border/80 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-primary font-medium"
        />
        <button
          type="submit"
          disabled={!customText.trim()}
          className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 shadow-sm"
        >
          <Icons.Plus className="h-4 w-4" />
          Agregar
        </button>
      </form>
    </div>
  )
}
