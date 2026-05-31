import { Question } from '@/types/onboarding'

export interface RouteParams {
  currentLevel: 0 | 1 | 2 | 3
  onboardingPath: 'quick' | 'personalized' | 'super' | 'coach'
  section: string | null
  step: number
  questions: Question[] // Active questions in the current level sorted by position
}

export function getNextRoute({
  currentLevel,
  onboardingPath,
  section,
  step,
  questions,
}: RouteParams): string {
  // --- LEVEL 0 (Quick Start) ---
  if (currentLevel === 0) {
    if (step < 7) {
      return `/onboarding/quick-start/${step + 1}`
    } else {
      return '/onboarding/quick-start/confirmation'
    }
  }

  // --- LEVELS 1, 2, 3 (Data-Driven Onboarding) ---
  // Group questions by section to find their indices
  const sectionQuestions = questions.filter((q) => q.section === section)
  
  // If we are in the intro page of a section
  if (step === 0) {
    return `/onboarding/level-${currentLevel}/${section}/1`
  }

  // Check if there is a next question in the current section
  if (step < sectionQuestions.length) {
    return `/onboarding/level-${currentLevel}/${section}/${step + 1}`
  }

  // If we finished the current section, let's find the next section in this level
  const uniqueSections = Array.from(new Set(questions.map((q) => q.section)))
  const currentSectionIndex = uniqueSections.indexOf(section || '')
  
  if (currentSectionIndex !== -1 && currentSectionIndex < uniqueSections.length - 1) {
    const nextSection = uniqueSections[currentSectionIndex + 1]
    return `/onboarding/level-${currentLevel}/${nextSection}/intro`
  }

  // --- LEVEL COMPLETED ---
  if (currentLevel === 1) {
    if (onboardingPath === 'personalized') {
      return '/onboarding/complete'
    } else {
      // Go to level 2 (intro page of its first section)
      return '/onboarding/level-2/start' // intermediary route that resolves next level's first section dynamically
    }
  }

  if (currentLevel === 2) {
    if (onboardingPath === 'super') {
      return '/onboarding/complete'
    } else {
      // Go to level 3
      return '/onboarding/level-3/start'
    }
  }

  // Level 3 is the absolute max
  return '/onboarding/complete'
}

export function getPreviousRoute({
  currentLevel,
  onboardingPath,
  section,
  step,
  questions,
}: RouteParams): string {
  // --- LEVEL 0 (Quick Start) ---
  if (currentLevel === 0) {
    if (step > 1) {
      return `/onboarding/quick-start/${step - 1}`
    } else {
      return '/onboarding/path-selector'
    }
  }

  // --- LEVELS 1, 2, 3 ---
  if (step > 1) {
    return `/onboarding/level-${currentLevel}/${section}/${step - 1}`
  }

  if (step === 1) {
    return `/onboarding/level-${currentLevel}/${section}/intro`
  }

  // If step === 0 (intro page of a section)
  const uniqueSections = Array.from(new Set(questions.map((q) => q.section)))
  const currentSectionIndex = uniqueSections.indexOf(section || '')

  if (currentSectionIndex > 0) {
    const prevSection = uniqueSections[currentSectionIndex - 1]
    const prevSectionQuestions = questions.filter((q) => q.section === prevSection)
    return `/onboarding/level-${currentLevel}/${prevSection}/${prevSectionQuestions.length}`
  }

  // First section intro of this level
  if (currentLevel === 1) {
    return '/onboarding/quick-start/confirmation'
  }

  if (currentLevel === 2) {
    return '/onboarding/level-1/start' // resolves prev level's last question
  }

  if (currentLevel === 3) {
    return '/onboarding/level-2/start'
  }

  return '/onboarding/path-selector'
}
