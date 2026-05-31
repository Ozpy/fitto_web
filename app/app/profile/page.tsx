'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { calculateSectionCompletion } from '@/utils/completion'
import { Button } from '@/components/ui/button'
import { getFallbackQuestionsForLevel } from '@/lib/api/onboarding'

// Dynamic Section categorization mapping
const categories = [
  {
    id: 'basic',
    title: '📦 Lo básico',
    desc: 'Objetivo físico, equipamiento y días disponibles',
    level: 0,
    sections: ['quick_start'], // Quick Start Level 0 questions
    icon: Icons.Sliders,
  },
  {
    id: 'body',
    title: '📊 Cuerpo',
    desc: 'Estatura, peso actual, metas y composición corporal',
    level: 1,
    sections: ['body', 'composition'],
    icon: Icons.Scale,
  },
  {
    id: 'lifestyle',
    title: '🏃 Estilo de vida',
    desc: 'Horas de sueño, estrés, hábitos de consumo y valores',
    level: 1,
    sections: ['lifestyle', 'values'],
    icon: Icons.Brain,
  },
  {
    id: 'health',
    title: '🩺 Salud',
    desc: 'Condiciones médicas, alergias, lesiones y medicación',
    level: 2,
    sections: ['medical_basic', 'cardiovascular', 'reproductive', 'family_history'],
    icon: Icons.ShieldAlert,
  },
  {
    id: 'mental',
    title: '🧠 Mental y motivación',
    desc: 'Motivadores principales, relación con el entreno y psicología',
    level: 3,
    sections: ['psychology', 'preferences'],
    icon: Icons.Compass,
  },
]

export default function ProfileHubPage() {
  const router = useRouter()
  const supabase = createClient()
  const { data: user } = useUser()
  const { data: profileData, isLoading: loadingProfile } = useProfile(user?.id)

  // Fetch all active questions across level 0, 1, 2, 3 to count them
  const { data: allQuestions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['all-active-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_questions')
        .select(`
          *,
          options:onboarding_question_options(*)
        `)
        .eq('active', true)
      
      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 60,
  })

  if (loadingProfile || loadingQuestions || !user) {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center space-y-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-25"></span>
          <Icons.User className="h-8 w-8 text-primary animate-pulse relative z-10" />
        </div>
        <p className="text-muted-foreground font-semibold text-sm animate-pulse">
          Sincronizando tus datos biométricos...
        </p>
      </div>
    )
  }

  // Calculate percentages dynamically per Category
  const categoriesWithProgress = categories.map((cat) => {
    // Filter questions belonging to this category's sections and level dynamically
    const catQuestions = allQuestions.filter((q: any) => {
      return q.active === true && q.level === cat.level && cat.sections.includes(q.section)
    })

    // Calculate completed fields using the utility
    const percent = profileData
      ? calculateSectionCompletion(catQuestions, profileData)
      : 0

    return {
      ...cat,
      percent,
      totalQuestionsCount: catQuestions.length,
    }
  })

  const userProfile = profileData?.user_profiles || {}
  const dbCompletionLevel = userProfile.completion_level ?? null
  const onboardingPath = userProfile.onboarding_path || 'quick'

  // --- DYNAMIC RE-CALCULATION OF COMPLETION LEVEL ---
  // Recalculate level dynamically based on category completion percentages.
  // This resolves the bug where user manually completes sections but the circular gauge remains at 40%.
  let calculatedCompletionLevel = 0;
  const bodyComp = categoriesWithProgress.find(c => c.id === 'body')?.percent || 0;
  const lifestyleComp = categoriesWithProgress.find(c => c.id === 'lifestyle')?.percent || 0;
  const healthComp = categoriesWithProgress.find(c => c.id === 'health')?.percent || 0;
  const mentalComp = categoriesWithProgress.find(c => c.id === 'mental')?.percent || 0;

  if (bodyComp >= 80 && lifestyleComp >= 80) {
    calculatedCompletionLevel = 1;
  }
  if (calculatedCompletionLevel === 1 && healthComp >= 80) {
    calculatedCompletionLevel = 2;
  }
  if (calculatedCompletionLevel === 2 && mentalComp >= 80) {
    calculatedCompletionLevel = 3;
  }

  const completionLevel = Math.max(dbCompletionLevel ?? 0, calculatedCompletionLevel);

  // Customization Level definitions
  const personalizationLevels = [
    { title: 'Básico', desc: 'Plan inicial funcional', dots: 2, percent: 40, color: 'from-amber-500 to-orange-500', glow: 'shadow-orange-500/20' },
    { title: 'Personalizado', desc: 'Ajustado a tu estilo', dots: 3, percent: 65, color: 'from-blue-500 to-indigo-500', glow: 'shadow-indigo-500/20' },
    { title: 'Súper personalizado', desc: 'Análisis clínico de salud', dots: 4, percent: 85, color: 'from-purple-500 to-pink-500', glow: 'shadow-purple-500/20' },
    { title: 'Coach Personal IA', desc: 'Monitoreo científico completo', dots: 5, percent: 100, color: 'from-emerald-500 to-teal-500', glow: 'shadow-emerald-500/20' },
  ]

  // Determine current active level card based on completion_level
  let activeLevelCard = personalizationLevels[0]
  if (completionLevel === 1) activeLevelCard = personalizationLevels[1]
  if (completionLevel === 2) activeLevelCard = personalizationLevels[2]
  if (completionLevel >= 3) activeLevelCard = personalizationLevels[3]

  const handleContinueOnboarding = () => {
    // Dynamically pushes user to the next incomplete level step
    if (completionLevel === null || completionLevel === undefined) {
      router.push('/onboarding/path-selector')
    } else if (completionLevel === 0) {
      router.push('/onboarding/level-1/start')
    } else if (completionLevel === 1) {
      router.push('/onboarding/level-2/start')
    } else if (completionLevel === 2) {
      router.push('/onboarding/level-3/start')
    } else {
      // Completed, let them edit basics or custom sections
      router.push('/app/dashboard')
    }
  }

  const isFullyCompleted = completionLevel !== null && completionLevel >= 3

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header Profile Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Mi Perfil</h1>
          <p className="text-sm font-semibold text-muted-foreground mt-1">
            Gestiona tus datos de salud, cuerpo, estilo de vida y nivel de personalización de IA.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personalization Level card */}
        <div className="md:col-span-1 bg-card border border-border/60 rounded-[2.5rem] p-6 shadow-md flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest leading-none">
              Nivel de Personalización
            </span>
            
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-foreground leading-tight">
                {activeLevelCard.title}
              </h3>
              <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
                {activeLevelCard.desc}
              </p>
            </div>

            {/* SVG Circular Progress Gauge */}
            <div className="relative flex items-center justify-center py-4 select-none">
              <svg className="w-32 h-32 transform -rotate-90">
                {/* Background track */}
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className="stroke-muted"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Glowing indicator */}
                <motion.circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke={`url(#gaugeGradient-${activeLevelCard.percent})`}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 52}
                  initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - activeLevelCard.percent / 100) }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
                
                {/* Gradient Definition */}
                <defs>
                  <linearGradient id={`gaugeGradient-${activeLevelCard.percent}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={activeLevelCard.percent === 40 ? '#f59e0b' : activeLevelCard.percent === 65 ? '#3b82f6' : activeLevelCard.percent === 85 ? '#a855f7' : '#10b981'} />
                    <stop offset="100%" stopColor={activeLevelCard.percent === 40 ? '#f97316' : activeLevelCard.percent === 65 ? '#6366f1' : activeLevelCard.percent === 85 ? '#ec4899' : '#14b8a6'} />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Center indicator percentage */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-foreground leading-none">
                  {activeLevelCard.percent}%
                </span>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                  Poder IA
                </span>
              </div>
            </div>

            {/* Personalized dots */}
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                Puntos de Sintonía:
              </span>
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                      idx < activeLevelCard.dots
                        ? `bg-gradient-to-br ${activeLevelCard.color} shadow-md`
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => router.push('/onboarding/path-selector')}
              className="text-xs font-black text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 mt-2.5 active:scale-95 cursor-pointer leading-none"
            >
              <Icons.Settings className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Cambiar plan de personalización</span>
            </button>
          </div>

          <div className="space-y-3.5 pt-4 border-t border-border/40 flex flex-col gap-3">
            <Button
              onClick={() => router.push('/app/workouts')}
              className="w-full rounded-full py-5 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-emerald-500/20 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer"
            >
              <Icons.Dumbbell className="h-4 w-4 text-emerald-500" />
              <span>Ver mi plan inteligente</span>
            </Button>

            {!isFullyCompleted ? (
              <>
                <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                  Para subir la personalización al máximo de IA, completa las secciones restantes.
                </p>
                <Button
                  onClick={handleContinueOnboarding}
                  className="w-full rounded-full py-5 font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 hover:shadow-primary/20"
                >
                  <span>Continuar mi perfil</span>
                  <Icons.ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </Button>
              </>
            ) : (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-2 text-xs font-bold text-foreground">
                <Icons.CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <span>¡Tu personalización está al máximo nivel!</span>
              </div>
            )}
          </div>
        </div>

        {/* Categories checklist grid */}
        <div className="md:col-span-2 space-y-4">
          <span className="text-xs font-black text-muted-foreground uppercase tracking-widest leading-none px-1">
            Secciones de Diagnóstico
          </span>

          <div className="flex flex-col gap-3">
            {categoriesWithProgress.map((cat) => {
              const isCompleted = cat.percent === 100
              const isStarted = cat.percent > 0
              const Icon = cat.icon

              return (
                <motion.div
                  key={cat.id}
                  whileHover={{ scale: 1.01, x: 2 }}
                  onClick={() => router.push(`/app/profile/edit/${cat.id}`)}
                  className="p-5 bg-card border border-border/60 rounded-3xl hover:border-primary/40 hover:shadow-md cursor-pointer transition-all flex items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-muted rounded-2xl text-muted-foreground mt-0.5 shrink-0">
                      <Icon className="h-5 w-5 stroke-[2]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-base text-foreground leading-snug">
                        {cat.title}
                      </h4>
                      <p className="text-xs font-semibold text-muted-foreground leading-relaxed max-w-md">
                        {cat.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {/* Visual progress tags */}
                    {isCompleted ? (
                      <span className="text-[10px] font-black bg-primary/15 text-primary border border-primary/10 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 leading-none select-none">
                        <Icons.Check className="h-3 w-3 stroke-[3]" />
                        Completo
                      </span>
                    ) : isStarted ? (
                      <span className="text-[10px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/10 px-3 py-1 rounded-full uppercase tracking-wider leading-none select-none">
                        {cat.percent}% parcial
                      </span>
                    ) : (
                      <span className="text-[10px] font-black bg-muted text-muted-foreground px-3 py-1 rounded-full uppercase tracking-wider leading-none select-none">
                        Sin empezar
                      </span>
                    )}

                    <Icons.ChevronRight className="h-5 w-5 text-muted-foreground/60" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
