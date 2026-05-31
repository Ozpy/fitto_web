import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Icons from 'lucide-react'
import { Question } from '@/types/onboarding'

type Props = {
  question: Question
  value: string[] | null
  onChange: (value: string[]) => void
}

export default function MultiInputFreetext({ question, value = [], onChange }: Props) {
  const currentSelections = value || []
  const [inputText, setInputText] = useState('')

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed) return

    if (!currentSelections.includes(trimmed)) {
      onChange([...currentSelections, trimmed])
    }
    setInputText('')
  }

  const handleRemoveItem = (indexToRemove: number) => {
    onChange(currentSelections.filter((_, idx) => idx !== indexToRemove))
  }

  const handleClearAll = () => {
    onChange([])
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Clear/None Button at the top */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Elementos agregados ({currentSelections.length})
        </span>
        {currentSelections.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-bold text-destructive hover:underline flex items-center gap-1"
          >
            <Icons.Trash2 className="h-3.5 w-3.5" />
            No tomo nada / Limpiar todo
          </button>
        )}
      </div>

      {/* Added items list */}
      <div className="flex flex-col gap-2 w-full">
        <AnimatePresence initial={false}>
          {currentSelections.length > 0 ? (
            currentSelections.map((item, idx) => (
              <motion.div
                key={item + idx}
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="flex items-center justify-between p-4 bg-muted/40 border border-border/50 rounded-2xl"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-sm font-bold text-foreground">{item}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Icons.X className="h-4 w-4" />
                </button>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center border-2 border-dashed border-border/80 rounded-2xl text-sm text-muted-foreground font-medium">
              Ninguno agregado aún. Escríbelo abajo para añadirlo.
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Input row */}
      <form onSubmit={handleAddItem} className="flex gap-2 w-full mt-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe el nombre aquí..."
          className="flex-1 bg-muted/40 border border-border/80 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-primary font-medium"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 shadow-sm"
        >
          <Icons.Plus className="h-4 w-4" />
          Agregar
        </button>
      </form>
    </div>
  )
}
