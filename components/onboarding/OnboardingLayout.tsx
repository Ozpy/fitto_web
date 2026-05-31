'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import ProgressBar from './ProgressBar'
import { Button } from '@/components/ui/button'

interface OnboardingLayoutProps {
  children: React.ReactNode
  currentStep: number
  totalSteps: number
  activeSectionName?: string | null
  sections?: { name: string; label: string; startStep: number }[]
  onBack?: () => void
  onNext?: () => void
  onSkip?: () => void
  nextDisabled?: boolean
  nextLoading?: boolean
  isSkippable?: boolean
  title?: string
  subtitle?: string
}

export default function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  activeSectionName,
  sections = [],
  onBack,
  onNext,
  onSkip,
  nextDisabled = false,
  nextLoading = false,
  isSkippable = true,
  title,
  subtitle,
}: OnboardingLayoutProps) {
  const router = useRouter()

  const handleExit = () => {
    // Go to landing or dashboard depending on login status
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between py-6 px-4 sm:px-6 max-w-2xl mx-auto w-full relative">
      {/* Background soft blurs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-emerald-300/10 blur-3xl" />
      </div>

      {/* Header with back, progress and exit */}
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-foreground active:scale-95"
            >
              <Icons.ChevronLeft className="h-6 w-6 stroke-[2.5]" />
            </button>
          ) : (
            <div className="w-10" />
          )}

          <div className="flex-1 max-w-md">
            <ProgressBar
              currentStep={currentStep}
              totalSteps={totalSteps}
              sections={sections}
              activeSectionName={activeSectionName}
            />
          </div>

          <button
            type="button"
            onClick={handleExit}
            className="p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-destructive active:scale-95"
            title="Salir del Onboarding"
          >
            <Icons.X className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Dynamic titles */}
        {(title || subtitle) && (
          <div className="space-y-1.5 pt-4">
            {title && (
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </header>

      {/* Main body (releasing Framer motion slide effect) */}
      <main className="flex-1 flex flex-col justify-center py-8">
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer controls */}
      <footer className="flex items-center justify-between gap-4 pt-4 border-t border-border/40 bg-background/80 backdrop-blur-md sticky bottom-0 z-10 py-4">
        {isSkippable && onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-extrabold text-muted-foreground hover:text-foreground hover:underline transition-all py-2"
          >
            Saltar a mi plan
          </button>
        ) : (
          <div className="w-2" />
        )}

        <Button
          onClick={onNext}
          disabled={nextDisabled || nextLoading}
          className="rounded-full px-8 py-6 font-extrabold text-base flex items-center gap-2 group shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all"
        >
          {nextLoading ? (
            <Icons.Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <span>Siguiente</span>
              <Icons.ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </footer>
    </div>
  )
}
