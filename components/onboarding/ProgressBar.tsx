'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  sections?: { name: string; label: string; startStep: number }[]
  activeSectionName?: string | null
}

export default function ProgressBar({
  currentStep,
  totalSteps,
  sections = [],
  activeSectionName,
}: ProgressBarProps) {
  const percentage = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Percentage text */}
      <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
        <span>
          {activeSectionName ? `Sección: ${activeSectionName}` : 'Progreso'}
        </span>
        <span className="tabular-nums">
          Paso {currentStep} de {totalSteps} ({Math.round(percentage)}%)
        </span>
      </div>

      {/* Outer bar wrapper */}
      <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Section dots/markers (if levels > 0) */}
      {sections.length > 0 && (
        <div className="flex justify-between items-center w-full px-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest pt-0.5">
          {sections.map((sec, idx) => {
            const isCompleted = currentStep >= sec.startStep
            const isActive = activeSectionName === sec.name

            return (
              <div
                key={sec.name}
                className={`flex items-center gap-1 transition-colors ${
                  isActive
                    ? 'text-primary font-extrabold'
                    : isCompleted
                    ? 'text-foreground'
                    : 'text-muted-foreground/60'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    isActive
                      ? 'bg-primary ring-2 ring-primary/30 scale-125'
                      : isCompleted
                      ? 'bg-foreground'
                      : 'bg-muted-foreground/30'
                  }`}
                />
                <span className="hidden sm:inline">{sec.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
