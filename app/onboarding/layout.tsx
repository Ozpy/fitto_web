'use client'

import React from 'react'
import { AnimatePresence } from 'framer-motion'

export default function OnboardingRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased font-sans flex flex-col">
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </div>
  )
}
