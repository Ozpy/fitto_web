import { create } from 'zustand'

export type OnboardingPath = 'quick' | 'personalized' | 'super' | 'coach'

interface OnboardingState {
  // UI state
  currentLevel: 0 | 1 | 2 | 3
  currentSection: string | null
  currentStep: number
  onboardingPath: OnboardingPath | null

  // Draft answers cache (for fast inputs feedback and transition states)
  draftAnswers: Record<string, any>

  // Setters
  setCurrentLevel: (level: 0 | 1 | 2 | 3) => void
  setCurrentSection: (section: string | null) => void
  setCurrentStep: (step: number) => void
  setOnboardingPath: (path: OnboardingPath | null) => void
  setDraftAnswer: (questionSlug: string, value: any) => void
  setDraftAnswers: (answers: Record<string, any>) => void
  clearDrafts: () => void
  resetStore: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentLevel: 0,
  currentSection: null,
  currentStep: 1,
  onboardingPath: null,
  draftAnswers: {},

  setCurrentLevel: (currentLevel) => set({ currentLevel }),
  setCurrentSection: (currentSection) => set({ currentSection }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  setOnboardingPath: (onboardingPath) => set({ onboardingPath }),
  setDraftAnswer: (questionSlug, value) =>
    set((state) => ({
      draftAnswers: { ...state.draftAnswers, [questionSlug]: value },
    })),
  setDraftAnswers: (draftAnswers) => set({ draftAnswers }),
  clearDrafts: () => set({ draftAnswers: {} }),
  resetStore: () =>
    set({
      currentLevel: 0,
      currentSection: null,
      currentStep: 1,
      onboardingPath: null,
      draftAnswers: {},
    }),
}))
