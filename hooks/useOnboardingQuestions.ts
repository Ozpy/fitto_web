import { useQuery } from '@tanstack/react-query'
import { fetchOnboardingQuestions } from '@/lib/api/onboarding'

export function useOnboardingQuestions(level: number) {
  return useQuery({
    queryKey: ['onboarding-questions', level],
    queryFn: () => fetchOnboardingQuestions(level),
    staleTime: 1000 * 60 * 60, // 1 hour caching for static question list
  })
}
