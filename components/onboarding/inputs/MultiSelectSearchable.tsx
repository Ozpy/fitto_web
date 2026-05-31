import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Icons from 'lucide-react'
import { Question } from '@/types/onboarding'

type Props = {
  question: Question
  value: string[] | null
  onChange: (value: string[]) => void
}

export default function MultiSelectSearchable({ question, value = [], onChange }: Props) {
  const options = question.options || []
  const currentSelections = value || []
  const [searchQuery, setSearchQuery] = useState('')

  const toggleSelection = (val: string) => {
    if (currentSelections.includes(val)) {
      onChange(currentSelections.filter((item) => item !== val))
    } else {
      onChange([...currentSelections, val])
    }
  }

  const handleClearAll = () => {
    onChange([])
  }

  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (option.description && option.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Selected tags */}
      {currentSelections.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-muted/50 rounded-2xl border border-border/40">
          <AnimatePresence>
            {currentSelections.map((val) => {
              const opt = options.find((o) => o.value === val)
              if (!opt) return null
              return (
                <motion.span
                  key={val}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm"
                >
                  {opt.label}
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

      {/* Search Input + Clear Button */}
      <div className="flex gap-2 w-full">
        <div className="relative flex-1">
          <Icons.Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-muted/40 border border-border/80 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary font-medium"
          />
        </div>
        <button
          type="button"
          onClick={handleClearAll}
          className="px-4 py-3 rounded-2xl bg-card border border-border/80 text-sm font-bold text-destructive hover:bg-destructive/5 hover:border-destructive/30 transition-all flex items-center gap-1.5"
        >
          <Icons.Trash2 className="h-4 w-4" />
          Ninguna
        </button>
      </div>

      {/* Items list */}
      <div className="max-h-[220px] overflow-y-auto border border-border/60 rounded-2xl bg-card divide-y divide-border/40 scrollbar-thin">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => {
            const isSelected = currentSelections.includes(option.value)
            return (
              <div
                key={option.id}
                onClick={() => toggleSelection(option.value)}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border/80'
                  }`}
                >
                  {isSelected && <Icons.Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-foreground leading-snug">{option.label}</span>
                  {option.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground font-medium">
            No se encontraron opciones.
          </div>
        )}
      </div>
    </div>
  )
}
