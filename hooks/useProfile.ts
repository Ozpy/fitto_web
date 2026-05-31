import { useQuery } from '@tanstack/react-query'
import { fetchUserProfile } from '@/lib/api/profile'

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
    staleTime: 0, // Always refetch to ensure real-time synchronization with DB
  })
}
