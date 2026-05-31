import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Icons from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Question } from '@/types/onboarding'

type Props = {
  question: Question
  value: {
    answered: boolean
    hasActiveFollowup: boolean
    bodyParts: string[]
    description: string
  } | null
  onChange: (value: any) => void
}

export default function YesNoWithFollowup({ question, value, onChange }: Props) {
  const supabase = createClient()
  
  // Set default state structure
  const hasActiveFollowup = value?.hasActiveFollowup ?? false
  const selectedBodyParts = value?.bodyParts ?? []
  const description = value?.description ?? ''

  // Fetch body parts catalog from Supabase
  const { data: bodyParts = [] } = useQuery({
    queryKey: ['catalog-body-parts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_body_parts')
        .select('*')
        .order('position', { ascending: true })
      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 60, // 1 hour caching
  })

  const handleToggle = (boolVal: boolean) => {
    onChange({
      answered: true,
      hasActiveFollowup: boolVal,
      bodyParts: boolVal ? selectedBodyParts : [],
      description: boolVal ? description : '',
    })
  }

  const toggleBodyPart = (slug: string) => {
    let nextParts: string[]
    if (selectedBodyParts.includes(slug)) {
      nextParts = selectedBodyParts.filter((item) => item !== slug)
    } else {
      nextParts = [...selectedBodyParts, slug]
    }
    
    onChange({
      answered: true,
      hasActiveFollowup,
      bodyParts: nextParts,
      description,
    })
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      answered: true,
      hasActiveFollowup,
      bodyParts: selectedBodyParts,
      description: e.target.value,
    })
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Primary yes/no buttons */}
      <div className="flex gap-4 w-full">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleToggle(true)}
          className={`flex-1 py-4 rounded-2xl border-2 font-bold text-base transition-all flex items-center justify-center gap-2 ${
            hasActiveFollowup === true
              ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/10'
              : 'border-border/60 bg-card hover:bg-accent/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icons.CheckCircle2 className="h-5 w-5" />
          Sí, tengo
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleToggle(false)}
          className={`flex-1 py-4 rounded-2xl border-2 font-bold text-base transition-all flex items-center justify-center gap-2 ${
            value !== null && hasActiveFollowup === false
              ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/10'
              : 'border-border/60 bg-card hover:bg-accent/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icons.XCircle className="h-5 w-5" />
          No, ninguna
        </motion.button>
      </div>

      {/* Expandable followup inputs */}
      <AnimatePresence>
        {hasActiveFollowup && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4 p-5 bg-muted/40 border border-border/50 rounded-2xl overflow-hidden mt-1"
          >
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Icons.ShieldAlert className="h-4 w-4" />
              <span>¿Qué zona del cuerpo está afectada?</span>
            </div>

            {/* Grid of body parts */}
            <div className="grid grid-cols-3 gap-2 w-full max-h-[140px] overflow-y-auto p-1 scrollbar-thin">
              {bodyParts.map((bp) => {
                const isSelected = selectedBodyParts.includes(bp.slug)
                return (
                  <button
                    key={bp.slug}
                    type="button"
                    onClick={() => toggleBodyPart(bp.slug)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border/60 bg-card hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {bp.name}
                  </button>
                )
              })}
            </div>

            {/* Description textarea */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Icons.FileEdit className="h-3.5 w-3.5" />
                Detalles adicionales de la lesión
              </label>
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Ej. Dolor leve en la rodilla al flexionar, diagnóstico de tendinitis..."
                rows={3}
                className="w-full bg-card border border-border/80 rounded-xl p-3 text-sm focus:outline-none focus:border-primary font-medium"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
