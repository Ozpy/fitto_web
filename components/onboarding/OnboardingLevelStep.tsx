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
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { getSavedValue } from '@/utils/completion'

interface OnboardingLevelStepProps {
  level: 1 | 2 | 3
}

// Intermediary readable section names in Spanish
const sectionTitles: Record<string, { title: string; desc: string; icon: any }> = {
  body: {
    title: 'Hablemos de tu cuerpo',
    desc: 'Metas físicas, altura, peso y composición para calcular tu tasa metabólica basal.',
    icon: Icons.Scale,
  },
  fitness: {
    title: 'Tu condición física',
    desc: 'Experiencia previa, niveles de actividad y rendimiento para planificar intensidades.',
    icon: Icons.Activity,
  },
  lifestyle: {
    title: 'Hábitos y estilo de vida',
    desc: 'Rutina diaria, horas de sueño, niveles de estrés y hábitos de consumo.',
    icon: Icons.Brain,
  },
  medical_basic: {
    title: 'Historial de salud',
    desc: 'Condiciones médicas, alergias y limitaciones físicas para asegurar un entrenamiento seguro.',
    icon: Icons.ShieldAlert,
  },
  composition: {
    title: 'Composición avanzada',
    desc: 'Porcentaje de grasa corporal, masa muscular y pliegues para métricas metabólicas.',
    icon: Icons.TrendingUp,
  },
  cardiovascular: {
    title: 'Salud cardiovascular',
    desc: 'Frecuencia cardíaca en reposo, presión arterial y capacidad pulmonar.',
    icon: Icons.HeartPulse,
  },
  reproductive: {
    title: 'Salud hormonal',
    desc: 'Factores hormonales y metabólicos que influyen en tu rendimiento y recuperación.',
    icon: Icons.Sparkles,
  },
  family_history: {
    title: 'Antecedentes familiares',
    desc: 'Historial de salud familiar para predisposiciones preventivas inteligentes.',
    icon: Icons.Users,
  },
  psychology: {
    title: 'Psicología y mentalidad',
    desc: 'Motivadores clave, relación con el entrenamiento y metas psicológicas.',
    icon: Icons.Compass,
  },
  preferences: {
    title: 'Preferencias individuales',
    desc: 'Entornos de entreno preferidos, música, horarios y gustos de rutinas.',
    icon: Icons.Smile,
  },
  values: {
    title: 'Valores y prioridades',
    desc: 'Escalas de prioridad de salud, familia, trabajo y rendimiento.',
    icon: Icons.Star,
  },
  nutrition: {
    title: 'Hábitos alimentarios',
    desc: 'Preferencias dietéticas, número de comidas y suplementación.',
    icon: Icons.Apple,
  },
}

export default function OnboardingLevelStep({ level }: OnboardingLevelStepProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useParams()
  const supabase = createClient()
  
  const section = (params.section as string) || ''
  const stepParam = params.step as string
  const isIntro = stepParam === 'intro'
  const step = isIntro ? 0 : Number(stepParam) || 1

  const { data: user } = useUser()
  const { data: profileData, isLoading: loadingProfile } = useProfile(user?.id)
  const { data: questions = [], isLoading: loadingQuestions } = useOnboardingQuestions(level)
  
  const {
    draftAnswers,
    setDraftAnswer,
    onboardingPath,
  } = useOnboardingStore()

  const saveMutation = useMutation({
    mutationFn: saveAnswer,
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      }
    },
  })

  if (loadingQuestions || loadingProfile || !user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-background">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-25"></span>
          <Icons.Loader2 className="h-8 w-8 text-primary animate-spin relative z-10" />
        </div>
        <p className="text-muted-foreground font-semibold text-sm animate-pulse">
          Cargando nivel {level}...
        </p>
      </div>
    )
  }

  const activeQuestions = questions.filter((q) => q.active)
  const sectionQuestions = activeQuestions.filter((q) => q.section === section)

  // Dynamic progress metrics calculations
  const totalStepsInLevel = activeQuestions.length
  
  // Calculate current global step index for ProgressBar
  const currentSectionIndexInLevel = activeQuestions.findIndex((q) => q.section === section)
  const globalStep = currentSectionIndexInLevel !== -1 ? currentSectionIndexInLevel + (isIntro ? 0 : step) : 1

  // Format sections list for ProgressBar
  const uniqueSections = Array.from(new Set(activeQuestions.map((q) => q.section)))
  const progressSections = uniqueSections.map((secName) => {
    const titleMeta = sectionTitles[secName] || { title: secName }
    const firstIndex = activeQuestions.findIndex((q) => q.section === secName)
    return {
      name: secName,
      label: titleMeta.title.replace('Hablemos de tu ', '').replace('Tu ', ''),
      startStep: firstIndex + 1,
    }
  })

  // --- SECTION INTRO SPLASH VIEW ---
  if (isIntro) {
    const meta = sectionTitles[section] || {
      title: 'Hablemos de tu perfil',
      desc: 'Preguntas para optimizar las recomendaciones de tu coach IA.',
      icon: Icons.Sparkles,
    }
    const IntroIcon = meta.icon

    return (
      <div className="min-h-screen flex flex-col justify-between py-12 px-6 max-w-xl mx-auto w-full bg-background">
        <header className="flex justify-between items-center w-full">
          <button
            type="button"
            onClick={() => {
              const prev = getPreviousRoute({
                currentLevel: level,
                onboardingPath: onboardingPath || 'personalized',
                section,
                step: 0,
                questions: activeQuestions,
              })
              router.push(prev)
            }}
            className="p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-foreground active:scale-95"
          >
            <Icons.ChevronLeft className="h-6 w-6 stroke-[2.5]" />
          </button>
          
          <span className="text-xs font-black bg-primary/20 text-primary-foreground border border-primary/20 px-3.5 py-1.5 rounded-full uppercase tracking-wider select-none">
            Nivel {level}
          </span>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="p-5 rounded-[2rem] bg-primary/10 border border-primary/20 text-primary mb-2 shadow-inner"
          >
            <IntroIcon className="h-16 w-16 stroke-[1.5]" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-3"
          >
            <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">
              {meta.title}
            </h1>
            <p className="text-muted-foreground font-medium text-base leading-relaxed max-w-md mx-auto">
              {meta.desc}
            </p>
          </motion.div>
        </main>

        <footer className="w-full flex justify-center pt-6">
          <Button
            onClick={() => router.push(`/onboarding/level-${level}/${section}/1`)}
            className="w-full rounded-full py-7 font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-primary/30 active:scale-95 transition-all"
          >
            <span>Empezar sección</span>
            <Icons.ArrowRight className="h-5 w-5 stroke-[2.5]" />
          </Button>
        </footer>
      </div>
    )
  }

  // --- QUESTION VIEW ---
  const question = sectionQuestions[step - 1]

  if (!question) {
    router.push('/onboarding/path-selector')
    return null
  }

  const dbValue = getSavedValue(profileData, question)
  const value = draftAnswers[question.slug] !== undefined ? draftAnswers[question.slug] : dbValue

  // Schema validations
  const schema = buildSchemaForQuestion(question)
  const validationResult = schema.safeParse(value)
  const isInputValid = validationResult.success

  const handleValueChange = (newVal: any) => {
    // 1. Optimistic Zustand Save
    setDraftAnswer(question.slug, newVal)

    // 2. Database Save
    saveMutation.mutate({
      question,
      value: newVal,
      userId: user.id,
    })
  }

  const handleNext = () => {
    if (!isInputValid) return

    // Centralized dynamic next route
    const nextPath = getNextRoute({
      currentLevel: level,
      onboardingPath: onboardingPath || 'personalized',
      section,
      step,
      questions: activeQuestions,
    })

    // If level-2 is the next step start, push to its dynamic start router
    if (nextPath === '/onboarding/level-2/start') {
      // Set completed level in Supabase before routing
      completeLevelMutation.mutate({ lvl: 1, nextPath })
    } else if (nextPath === '/onboarding/level-3/start') {
      completeLevelMutation.mutate({ lvl: 2, nextPath })
    } else if (nextPath === '/onboarding/complete') {
      completeLevelMutation.mutate({ lvl: level, nextPath })
    } else {
      router.push(nextPath)
    }
  }

  const handleBack = () => {
    const prevPath = getPreviousRoute({
      currentLevel: level,
      onboardingPath: onboardingPath || 'personalized',
      section,
      step,
      questions: activeQuestions,
    })

    router.push(prevPath)
  }

  // Helper Mutation to update user completion level
  const completeLevelMutation = useMutation({
    mutationFn: async ({ lvl, nextPath }: { lvl: number; nextPath: string }) => {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          completion_level: lvl,
        }, { onConflict: 'user_id' })
      if (error) throw error
      return nextPath
    },
    onSuccess: (nextPath) => {
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      router.push(nextPath)
    },
  })

  // Show a message for Medical optional questions in Level 2
  const showOptionalDisclaimer = level === 2 && section === 'cardiovascular' && step === 1

  return (
    <OnboardingLayout
      currentStep={globalStep}
      totalSteps={totalStepsInLevel}
      activeSectionName={sectionTitles[section]?.title || section}
      sections={progressSections}
      onBack={handleBack}
      onNext={handleNext}
      nextDisabled={!isInputValid}
      nextLoading={saveMutation.isPending || completeLevelMutation.isPending}
      isSkippable={!question.is_required}
      onSkip={handleNext}
      title={question.question_text}
      subtitle={question.question_subtitle}
    >
      <div className="w-full pt-4 flex flex-col gap-5">
        {showOptionalDisclaimer && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-xs font-semibold text-foreground leading-relaxed flex gap-2.5 items-start">
            <Icons.ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p>
              Esta sección tiene preguntas médicas. Todas son opcionales. Mientras más completes, más precisas serán tus recomendaciones.
            </p>
          </div>
        )}

        <QuestionRenderer
          question={question}
          value={value}
          onChange={handleValueChange}
        />

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
