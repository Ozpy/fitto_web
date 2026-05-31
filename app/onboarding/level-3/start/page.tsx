'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import * as Icons from 'lucide-react'
import { useOnboardingQuestions } from '@/hooks/useOnboardingQuestions'

export default function LevelThreeStartPage() {
  const router = useRouter()
  const { data: questions = [], isLoading } = useOnboardingQuestions(3)

  useEffect(() => {
    if (!isLoading && questions.length > 0) {
      const activeQuestions = questions.filter((q) => q.active)
      if (activeQuestions.length > 0) {
        const firstSection = activeQuestions[0].section
        router.replace(`/onboarding/level-3/${firstSection}/intro`)
      } else {
        router.replace('/onboarding/complete')
      }
    } else if (!isLoading && questions.length === 0) {
      router.replace('/onboarding/complete')
    }
  }, [questions, isLoading, router])

  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-background">
      <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground font-semibold text-sm">
        Iniciando Nivel 3...
      </p>
    </div>
  )
}
