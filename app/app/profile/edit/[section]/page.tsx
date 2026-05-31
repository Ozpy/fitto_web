'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { saveAnswer, fetchOnboardingQuestions } from '@/lib/api/onboarding'
import { QuestionRenderer } from '@/components/onboarding/QuestionRenderer'
import { Button } from '@/components/ui/button'
import { buildSchemaForQuestion } from '@/utils/validation'

// Category mapping helper
const categorySections: Record<string, { title: string; sections: string[]; levelFilter: number }> = {
  basic: { title: '📦 Lo básico', sections: ['quick_start'], levelFilter: 0 },
  body: { title: '📊 Cuerpo y Composición', sections: ['body', 'composition'], levelFilter: 1 },
  lifestyle: { title: '🏃 Estilo de Vida y Hábitos', sections: ['lifestyle', 'values'], levelFilter: 1 },
  health: { title: '🩺 Historial de Salud', sections: ['medical_basic', 'cardiovascular', 'reproductive', 'family_history'], levelFilter: 2 },
  mental: { title: '🧠 Mental y Motivación', sections: ['psychology', 'preferences'], levelFilter: 3 },
}

export default function SectionEditorPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useParams()
  const supabase = createClient()
  
  const categoryId = (params.section as string) || ''
  const categoryMeta = categorySections[categoryId]

  const { data: user } = useUser()
  const { data: profileData, isLoading: loadingProfile } = useProfile(user?.id)

  const [localAnswers, setLocalAnswers] = React.useState<Record<string, any>>({})

  // Fetch active questions for the current level
  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['onboarding-questions', categoryMeta.levelFilter],
    queryFn: () => fetchOnboardingQuestions(categoryMeta.levelFilter),
    staleTime: 1000 * 60 * 60,
  })

  // Mutation for saving to Supabase in one batch
  const saveAllMutation = useMutation({
    mutationFn: async (answers: Record<string, any>) => {
      if (!user) throw new Error('No user authenticated')
      const promises = Object.keys(answers).map((slug) => {
        const q = activeQuestions.find((quest: any) => quest.slug === slug)
        if (!q) return Promise.resolve()
        return saveAnswer({
          question: q,
          value: answers[slug],
          userId: user.id,
        })
      })
      await Promise.all(promises)

      // --- DYNAMIC RE-CALCULATION OF COMPLETION LEVEL ---
      // Evaluates level of completion based on fields populated:
      const { data: updatedProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (updatedProfile) {
        let newLvl = 0;
        
        // Level 1: requires basic body info filled: height_cm, weight_kg, birth_date, sex
        const hasLevel1 = updatedProfile.height_cm && updatedProfile.weight_kg && updatedProfile.birth_date && updatedProfile.sex;
        
        // Level 2: requires health checks (user_health table)
        const { data: healthData } = await supabase
          .from("user_health")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        const hasLevel2 = hasLevel1 && healthData;

        // Level 3: has psychological motivators (user_psychology table)
        const { data: psychData } = await supabase
          .from("user_psychology")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        const hasLevel3 = hasLevel2 && psychData;

        if (hasLevel3) {
          newLvl = 3;
        } else if (hasLevel2) {
          newLvl = 2;
        } else if (hasLevel1) {
          newLvl = 1;
        }

        const currentLvl = updatedProfile.completion_level ?? 0;
        if (newLvl > currentLvl) {
          await supabase
            .from("user_profiles")
            .update({ completion_level: newLvl })
            .eq("user_id", user.id);
        }
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      }
      router.push('/app/profile')
    },
    onError: (error: any) => {
      console.error("FITTO Save Error:", error)
      alert("Error al guardar tus datos: " + (error.message || error))
    }
  })

  if (loadingProfile || loadingQuestions || !user || !categoryMeta) {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center space-y-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-25"></span>
          <Icons.Loader2 className="h-8 w-8 text-primary animate-spin relative z-10" />
        </div>
        <p className="text-muted-foreground font-semibold text-sm animate-pulse">
          Cargando editor de sección...
        </p>
      </div>
    )
  }

  // Filter questions belonging to this category
  const activeQuestions = questions.filter((q: any) => {
    return categoryMeta.sections.includes(q.section)
  })

  // Get saved value from Supabase initial profile data
  const getSavedValue = (q: any) => {
    const table = q.target_table
    const col = q.target_column

    if (!profileData) return null

    // For yes_no_with_followup questions (injuries)
    if (q.input_type === 'yes_no_with_followup') {
      const isInjury = table === 'user_injuries' || col === 'has_active_injury'
      if (isInjury) {
        const profile = profileData.user_profiles || {}
        const injuries = profileData.user_injuries || []
        const activeInjuries = injuries.filter((i: any) => i.is_active !== false)
        const activeSlugs = activeInjuries.map((i: any) => i.body_part_slug)
        const desc = activeInjuries.length > 0 ? activeInjuries[0].notes : ''

        const hasAnswered = profile.has_active_injury === false || 
          (profile.has_active_injury === true && activeInjuries.length > 0)

        return {
          answered: hasAnswered,
          hasActiveFollowup: profile.has_active_injury ?? false,
          bodyParts: activeSlugs,
          description: desc,
        }
      }
    }

    // Relational tables N:M
    if (table === 'user_conditions') {
      const conds = profileData.user_conditions || []
      return conds.filter((c: any) => c.is_active !== false).map((c: any) => c.condition_slug)
    }

    if (table === 'user_allergies') {
      const alls = profileData.user_allergies || []
      return alls.filter((a: any) => a.is_active !== false).map((a: any) => a.allergen)
    }

    if (table === 'user_medications') {
      const meds = profileData.user_medications || []
      return meds.filter((m: any) => m.is_active !== false).map((m: any) => m.name)
    }

    // Standard columns
    const tableData = (profileData as any)[table] || {}
    return tableData[col] !== undefined ? tableData[col] : null
  }

  const handleValueChange = (q: any, newVal: any) => {
    // Perform instant local state save
    setLocalAnswers((prev) => ({
      ...prev,
      [q.slug]: newVal,
    }))
  }

  // Check if all active questions have valid inputs
  const isFormValid = activeQuestions.every((q: any) => {
    const val = localAnswers[q.slug] !== undefined ? localAnswers[q.slug] : getSavedValue(q)
    const schema = buildSchemaForQuestion(q)
    return schema.safeParse(val).success
  })

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-24">
      {/* Header bar */}
      <div className="flex items-center gap-4 border-b border-border/40 pb-6">
        <button
          type="button"
          onClick={() => router.push('/app/profile')}
          className="p-2.5 hover:bg-muted border border-border/60 rounded-xl transition-all text-muted-foreground hover:text-foreground active:scale-95 shrink-0"
        >
          <Icons.ArrowLeft className="h-5 w-5 stroke-[2.5]" />
        </button>
        <div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">
            Editar sección
          </span>
          <h1 className="text-2xl font-black tracking-tight text-foreground mt-0.5">
            {categoryMeta.title}
          </h1>
        </div>
      </div>

      {/* Dynamic list of questions */}
      <div className="flex flex-col gap-8">
        {activeQuestions.map((q: any) => {
          const val = localAnswers[q.slug] !== undefined ? localAnswers[q.slug] : getSavedValue(q)
          const schema = buildSchemaForQuestion(q)
          const isInputValid = schema.safeParse(val).success

          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-card border border-border/60 rounded-[2rem] shadow-sm flex flex-col gap-4 relative"
            >
              <div>
                <h3 className="text-lg font-black text-foreground leading-snug tracking-tight">
                  {q.question_text}
                </h3>
                {q.question_subtitle && (
                  <p className="text-xs text-muted-foreground font-semibold mt-1">
                    {q.question_subtitle}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <QuestionRenderer
                  question={q}
                  value={val}
                  onChange={(newVal) => handleValueChange(q, newVal)}
                />
              </div>

              {val !== null && !isInputValid && (
                <div className="flex items-center gap-2 text-xs font-bold text-destructive/80 mt-1">
                  <Icons.Info className="h-4 w-4" />
                  <span>Este campo es requerido o tiene un formato no válido</span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Floating Save success message or returning CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-border/40 bg-background/80 backdrop-blur-md z-30 flex justify-center">
        <Button
          onClick={() => {
            if (!isFormValid) return
            if (Object.keys(localAnswers).length > 0) {
              saveAllMutation.mutate(localAnswers)
            } else {
              router.push('/app/profile')
            }
          }}
          disabled={saveAllMutation.isPending || !isFormValid}
          className="rounded-full px-12 py-6 font-black text-base shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {saveAllMutation.isPending ? (
            <Icons.Loader2 className="h-5 w-5 animate-spin mr-1.5" />
          ) : (
            <>
              <span>Guardar y regresar</span>
              <Icons.Check className="h-5 w-5 stroke-[2.5] ml-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
