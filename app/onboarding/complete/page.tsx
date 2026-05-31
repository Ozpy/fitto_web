'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import * as Icons from 'lucide-react'
import { Button } from '@/components/ui/button'

const loadingSteps = [
  { text: 'Analizando tu objetivo y equipo de entrenamiento...', icon: Icons.Activity },
  { text: 'Considerando tus hábitos, recuperación y estilo de vida...', icon: Icons.Brain },
  { text: 'Estructurando tu programa adaptativo de IA...', icon: Icons.Dumbbell },
  { text: 'Diseñando tu primera semana de entrenamientos...', icon: Icons.Sparkles },
  { text: '¡Todo listo! Tu sistema operativo de salud está configurado.', icon: Icons.CheckCircle2 },
]

export default function OnboardingCompletePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    if (currentStep < loadingSteps.length - 1) {
      const interval = setTimeout(() => {
        setCurrentStep((prev) => prev + 1)
      }, 2200) // 2.2 seconds per AI status change
      return () => clearTimeout(interval)
    } else {
      setIsFinished(true)
    }
  }, [currentStep])

  const StepIcon = loadingSteps[currentStep].icon

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-6 max-w-lg mx-auto w-full relative bg-background">
      {/* Background blurs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-10 text-center"
      >
        <div className="space-y-4">
          <motion.div
            animate={isFinished ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
            className="inline-flex p-4 rounded-[2rem] bg-primary/15 border border-primary/20 text-primary"
          >
            {isFinished ? (
              <Icons.PartyPopper className="h-14 w-14 stroke-[1.5]" />
            ) : (
              <Icons.Cpu className="h-14 w-14 stroke-[1.5] animate-pulse" />
            )}
          </motion.div>

          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-none">
            {isFinished ? '¡Tu perfil está completo!' : 'Generando tu plan con IA'}
          </h1>
          <p className="text-sm font-semibold text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {isFinished
              ? 'Hemos diseñado un ecosistema a la medida exacta de tus metas. Es hora de comenzar.'
              : 'Nuestra inteligencia artificial está compilando tus datos biométricos, médicos y de rutina...'}
          </p>
        </div>

        {/* Dynamic step status box */}
        <div className="bg-card border border-border/60 rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 flex flex-col items-center justify-center gap-6 min-h-[160px] relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <StepIcon className="h-8 w-8 animate-pulse" />
              </div>
              <span className="text-base font-extrabold text-foreground leading-snug px-2">
                {loadingSteps[currentStep].text}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Satisfying continuous loading bar */}
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / loadingSteps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* CTA to Hub */}
        <AnimatePresence>
          {isFinished && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full pt-4"
            >
              <Button
                onClick={() => router.push('/app/profile')}
                className="w-full rounded-full py-7 font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-primary/30 active:scale-95 transition-all"
              >
                <span>Ir a mi Perfil</span>
                <Icons.ArrowRight className="h-5 w-5 stroke-[2.5]" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
