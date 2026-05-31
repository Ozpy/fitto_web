'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOnboardingStore } from '@/stores/onboarding-store'
import { useProfile } from '@/hooks/useProfile'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'

export default function QuickStartConfirmationPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()
  
  const { data: user } = useUser()
  const { data: profileData, isLoading: loadingProfile } = useProfile(user?.id)
  
  const { onboardingPath, draftAnswers } = useOnboardingStore()
  
  const completeLevelZeroMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user authenticated')
      
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          completion_level: 0,
        }, { onConflict: 'user_id' })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      
      // Navigate based on onboardingPath intention
      if (onboardingPath === 'quick') {
        router.push('/onboarding/complete')
      } else {
        router.push('/onboarding/level-1/body/intro')
      }
    },
  })

  if (loadingProfile || !user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-background">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-25"></span>
          <Icons.CheckCircle2 className="h-8 w-8 text-primary animate-pulse relative z-10" />
        </div>
        <p className="text-muted-foreground font-semibold text-sm animate-pulse">
          Cargando tu resumen...
        </p>
      </div>
    )
  }

  const profile = profileData?.user_profiles || {}

  // Highly resilient value resolver checking all possible key patterns in both Zustand and Supabase
  const getVal = (slug: string, dbField: string) => {
    // 1. Try slug in draftAnswers
    if (draftAnswers && draftAnswers[slug] !== undefined && draftAnswers[slug] !== null && draftAnswers[slug] !== '') {
      return draftAnswers[slug]
    }
    // 2. Try dbField in draftAnswers
    if (draftAnswers && draftAnswers[dbField] !== undefined && draftAnswers[dbField] !== null && draftAnswers[dbField] !== '') {
      return draftAnswers[dbField]
    }
    // 3. Try dbField in Supabase profile
    if (profile && profile[dbField] !== undefined && profile[dbField] !== null && profile[dbField] !== '') {
      return profile[dbField]
    }
    // 4. Try slug in Supabase profile
    if (profile && profile[slug] !== undefined && profile[slug] !== null && profile[slug] !== '') {
      return profile[slug]
    }
    return undefined
  }

  // Helper values translation
  const goalTranslation: Record<string, string> = {
    muscle_gain: 'Ganar Masa Muscular',
    fat_loss: 'Perder Grasa',
    strength: 'Fuerza Absoluta',
    health: 'Salud y Longevidad',
    recomposition: 'Tonificar y Definir',
    performance: 'Performance / Rendimiento',
  }

  const sexTranslation: Record<string, string> = {
    male: 'Hombre',
    female: 'Mujer',
    unspecified: 'Prefiero no decir',
    other: 'Otro',
  }

  // Calculate age from birth date
  const calculateAge = (birthDateString: string) => {
    if (!birthDateString || birthDateString === 'No especificado') return 'No especificado'
    const today = new Date()
    const birthDate = new Date(birthDateString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return `${age} años`
  }

  const summaryItems = [
    {
      icon: Icons.Target,
      label: 'Objetivo Principal',
      value: goalTranslation[getVal('q_primary_goal', 'primary_goal')] || getVal('q_primary_goal', 'primary_goal') || 'No especificado',
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      icon: Icons.User,
      label: 'Sexo Biológico',
      value: sexTranslation[getVal('q_sex', 'sex')] || getVal('q_sex', 'sex') || 'No especificado',
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      icon: Icons.Calendar,
      label: 'Edad',
      value: calculateAge(getVal('q_birth_date', 'birth_date')),
      color: 'text-purple-500 bg-purple-500/10',
    },
    {
      icon: Icons.Dumbbell,
      label: 'Equipamiento',
      value: (() => {
        const eq = getVal('q_equipment', 'available_equipment')
        if (Array.isArray(eq) && eq.length > 0) {
          return `${eq.length} seleccionados`
        }
        return 'No especificado'
      })(),
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      icon: Icons.CalendarRange,
      label: 'Días de Entreno',
      value: getVal('q_days_per_week', 'available_days_per_week') ? `${getVal('q_days_per_week', 'available_days_per_week')} días por semana` : 'No especificado',
      color: 'text-pink-500 bg-pink-500/10',
    },
    {
      icon: Icons.Clock,
      label: 'Duración por Sesión',
      value: getVal('q_session_duration', 'session_duration_minutes') ? `${getVal('q_session_duration', 'session_duration_minutes')} minutos` : 'No especificado',
      color: 'text-cyan-500 bg-cyan-500/10',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-6 max-w-xl mx-auto w-full relative bg-background">
      {/* Dynamic blurs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-64 h-64 rounded-full bg-emerald-300/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="space-y-8"
      >
        <div className="text-center space-y-2.5">
          <div className="inline-flex p-3 rounded-full bg-primary/20 text-primary-foreground">
            <Icons.PartyPopper className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground leading-none">
            ¡Listo! Esto es lo que sé de ti
          </h1>
          <p className="text-sm text-muted-foreground font-semibold">
            Hemos consolidado tu perfil base. Elige generar el plan o seguir personalizando.
          </p>
        </div>

        {/* Dashboard summary grid card */}
        <div className="bg-card border border-border/80 rounded-[2rem] p-6 shadow-xl shadow-primary/5 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Icons.Flame className="w-32 h-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            {summaryItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3.5 bg-muted/20 border border-border/40 rounded-2xl"
              >
                <div className={`p-2.5 rounded-xl ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                    {item.label}
                  </span>
                  <p className="text-sm font-black text-foreground mt-0.5 leading-snug">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-3.5 w-full">
          <Button
            onClick={() => completeLevelZeroMutation.mutate()}
            disabled={completeLevelZeroMutation.isPending}
            className="w-full rounded-full py-7 font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-primary/30 active:scale-95 transition-all"
          >
            {completeLevelZeroMutation.isPending ? (
              <Icons.Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <span>Generar mi plan</span>
                <Icons.Sparkles className="h-5 w-5 stroke-[2.5]" />
              </>
            )}
          </Button>

          {onboardingPath !== 'quick' && (
            <div className="text-center">
              <span className="text-xs font-bold text-muted-foreground">
                Como seleccionaste el camino <strong className="text-foreground">{onboardingPath}</strong>, continuaremos con preguntas adicionales para afinar tu plan.
              </span>
            </div>
          )}

          {/* Dynamic UX/UI System Debug Console */}
          <div className="mt-6 p-4 rounded-2xl bg-card border border-border/80 text-[10px] font-mono text-muted-foreground space-y-1 shadow-inner shadow-black/5 max-h-[150px] overflow-y-auto">
            <div className="font-extrabold text-foreground uppercase tracking-wider text-[9px] mb-1 flex items-center gap-1">
              <Icons.Terminal className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span>Consola de Sincronización FITTO</span>
            </div>
            <div className="break-all"><strong className="text-primary">Draft Store:</strong> {JSON.stringify(draftAnswers)}</div>
            <div className="break-all"><strong className="text-primary">DB Profile:</strong> {JSON.stringify(profile)}</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
