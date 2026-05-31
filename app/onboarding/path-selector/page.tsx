'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOnboardingStore, OnboardingPath } from '@/stores/onboarding-store'
import { useUser } from '@/hooks/useUser'

export default function PathSelectorPage() {
  const router = useRouter()
  const supabase = createClient()
  const { data: user } = useUser()
  const { setOnboardingPath } = useOnboardingStore()
  const [selectedPath, setSelectedPath] = useState<OnboardingPath | null>(null)

  const savePathMutation = useMutation({
    mutationFn: async (path: OnboardingPath) => {
      if (!user) throw new Error('No authenticated user found')
      
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          onboarding_path: path,
          completion_level: null, // Resetting completion level on path change/start
        }, { onConflict: 'user_id' })

      if (error) throw error
    },
    onSuccess: (_, path) => {
      setOnboardingPath(path)
      router.push('/onboarding/quick-start/1')
    },
  })

  const pathsList = [
    {
      id: 'quick' as OnboardingPath,
      title: '⚡ Rápido',
      duration: '2 min',
      description: 'Plan estructurado rápido de entrenamiento generado al instante.',
      stars: 2, // Raised from 1 to 2 stars to give more baseline value
      accent: 'from-amber-400/20 to-orange-500/10',
      borderHover: 'hover:border-amber-500/50',
      icon: Icons.Zap,
    },
    {
      id: 'personalized' as OnboardingPath,
      title: '🎯 Personalizado',
      duration: '7 min',
      description: 'Plan ajustado detalladamente a tu tipo de cuerpo, hábitos y estilo.',
      stars: 3,
      accent: 'from-blue-400/20 to-indigo-500/10',
      borderHover: 'hover:border-blue-500/50',
      icon: Icons.Target,
    },
    {
      id: 'super' as OnboardingPath,
      title: '💎 Súper personalizado',
      duration: '15 min',
      description: 'Como tener un coach analizando cada detalle clínico de tu salud física.',
      stars: 4,
      accent: 'from-purple-400/20 to-pink-500/10',
      borderHover: 'hover:border-purple-500/50',
      icon: Icons.Gem,
    },
    {
      id: 'coach' as OnboardingPath,
      title: '🏆 Coach Personal IA',
      duration: '30 min',
      description: 'Diagnóstico clínico completo con recomendaciones científicas muy avanzadas.',
      stars: 5,
      accent: 'from-emerald-400/20 to-teal-500/10',
      borderHover: 'hover:border-emerald-500/50',
      icon: Icons.Trophy,
    },
  ]

  const handleSelect = async (path: OnboardingPath) => {
    setSelectedPath(path)
    
    // Guest or unauthenticated fallback
    if (!user) {
      console.warn('No authenticated user found, proceeding in simulated mode.')
      setOnboardingPath(path)
      router.push('/onboarding/quick-start/1')
      return
    }

    try {
      await savePathMutation.mutateAsync(path)
    } catch (err) {
      console.error('Database write failed, falling back to simulated mode:', err)
      setOnboardingPath(path)
      router.push('/onboarding/quick-start/1')
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-6 max-w-4xl mx-auto w-full relative">
      {/* Background circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-emerald-300/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex p-3 rounded-2xl bg-primary/20 text-primary-foreground font-semibold shadow-inner"
          >
            <Icons.Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </motion.div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight max-w-2xl mx-auto">
            ¿Cuánto tiempo tienes para conocerte mejor?
          </h1>
          <p className="text-muted-foreground font-semibold text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Mientras más datos compartas con FITTO, más preciso e hiper-adaptado será tu plan de IA.
          </p>
        </div>

        {/* 2x2 Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pathsList.map((p) => {
            const isPending = savePathMutation.isPending && selectedPath === p.id
            const Icon = p.icon

            return (
              <motion.div
                key={p.id}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => !savePathMutation.isPending && handleSelect(p.id)}
                className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[220px] relative overflow-hidden bg-card ${p.borderHover} ${
                  selectedPath === p.id
                    ? 'border-primary shadow-2xl shadow-primary/10 ring-4 ring-primary/5'
                    : 'border-border/60 hover:shadow-xl'
                }`}
              >
                {/* Background soft accent */}
                <div className={`absolute inset-0 bg-gradient-to-br ${p.accent} opacity-40 pointer-events-none -z-10`} />

                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-card border border-border/80 rounded-2xl text-foreground">
                      <Icon className="h-6 w-6 stroke-[2]" />
                    </div>
                    
                    <span className="text-xs font-black bg-primary/20 text-primary-foreground border border-primary/20 px-3.5 py-1.5 rounded-full select-none uppercase tracking-wider">
                      {p.duration}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-black text-xl text-foreground leading-none">{p.title}</h3>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border/20 mt-4 relative z-10">
                  {/* Personalization dots */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                      Ajuste IA:
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full ${
                            idx < p.stars ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {isPending ? (
                    <Icons.Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <Icons.ChevronRight className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
