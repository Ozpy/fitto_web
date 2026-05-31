'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOnboardingStore } from '@/stores/onboarding-store'
import { useOnboardingQuestions } from '@/hooks/useOnboardingQuestions'
import { useUser } from '@/hooks/useUser'
import { saveAnswer } from '@/lib/api/onboarding'
import { QuestionRenderer } from '@/components/onboarding/QuestionRenderer'
import OnboardingLayout from '@/components/onboarding/OnboardingLayout'
import { getNextRoute, getPreviousRoute } from '@/lib/utils/routing'
import { buildSchemaForQuestion } from '@/utils/validation'
import { useProfile } from '@/hooks/useProfile'
import { getSavedValue } from '@/utils/completion'

export default function QuickStartStepPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { step: stepParam } = useParams()
  const step = Number(stepParam) || 1

  const { data: user } = useUser()
  const { data: profileData, isLoading: loadingProfile } = useProfile(user?.id)
  const { data: questions = [], isLoading: loadingQuestions } = useOnboardingQuestions(0)
  
  const {
    draftAnswers,
    setDraftAnswer,
    onboardingPath,
    setOnboardingPath,
  } = useOnboardingStore()

  // Mutation for immediate saving to Supabase
  const saveMutation = useMutation({
    mutationFn: saveAnswer,
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      }
    },
  })

  // Loading indicator while auth or questions are loading
  if (loadingQuestions || loadingProfile || !user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-background">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-25"></span>
          <Icons.Activity className="h-8 w-8 text-primary animate-pulse relative z-10" />
        </div>
        <p className="text-muted-foreground font-semibold text-sm animate-pulse">
          Estructurando tu onboarding...
        </p>
      </div>
    )
  }

  // Active questions filter
  const activeQuestions = questions.filter((q) => q.active)
  
  if (activeQuestions.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-background text-center px-6">
        <Icons.AlertTriangle className="h-10 w-10 text-destructive" />
        <h3 className="text-lg font-bold">Sin preguntas disponibles</h3>
        <p className="text-sm text-muted-foreground">
          No hay preguntas de Quick Start activas en la base de datos actualmente.
        </p>
      </div>
    )
  }

  // Find the question matching the step
  const question = activeQuestions[step - 1]

  if (!question) {
    // If step is out of bounds, route to confirm or path-selector
    router.push('/onboarding/path-selector')
    return null
  }

  // Value getter (Zustand draft OR Supabase initial database value can be passed here)
  const dbValue = getSavedValue(profileData, question)
  const value = draftAnswers[question.slug] !== undefined ? draftAnswers[question.slug] : dbValue

  // Validation checking using Zod
  const schema = buildSchemaForQuestion(question)
  const validationResult = schema.safeParse(value)
  const isInputValid = validationResult.success

  const handleValueChange = (newVal: any) => {
    // 1. Save locally in Zustand immediately
    setDraftAnswer(question.slug, newVal)

    // 2. Perform immediate silent save to database
    saveMutation.mutate({
      question,
      value: newVal,
      userId: user.id,
    })
  }

  const handleNext = () => {
    if (!isInputValid) return

    // Centralized route resolution
    const nextPath = getNextRoute({
      currentLevel: 0,
      onboardingPath: onboardingPath || 'quick',
      section: null,
      step,
      questions: activeQuestions,
    })

    router.push(nextPath)
  }

  const handleBack = () => {
    const prevPath = getPreviousRoute({
      currentLevel: 0,
      onboardingPath: onboardingPath || 'quick',
      section: null,
      step,
      questions: activeQuestions,
    })
    
    router.push(prevPath)
  }

  return (
    <OnboardingLayout
      currentStep={step}
      totalSteps={activeQuestions.length}
      onBack={handleBack}
      onNext={handleNext}
      nextDisabled={!isInputValid}
      nextLoading={saveMutation.isPending}
      isSkippable={!question.is_required}
      onSkip={handleNext}
      title={question.question_text}
      subtitle={question.question_subtitle}
    >
      <div className="w-full pt-4">
        <QuestionRenderer
          question={question}
          value={value}
          onChange={handleValueChange}
        />
        
        {/* Helper friendly error alert if input was focused but invalid */}
        {value !== null && !isInputValid && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-4 text-xs font-bold text-destructive/80"
          >
            <Icons.Info className="h-4 w-4" />
            <span>Necesitamos esta respuesta para personalizar tu plan</span>
          </motion.div>
        )}
      </div>
    </OnboardingLayout>
  )
}
