import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as profilesDb from '../lib/db/profiles'

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profilesDb.getProfile(userId as string),
    enabled: !!userId,
  })
}

export function useUpdateDisplayName(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (displayName: string | null) => profilesDb.updateDisplayName(userId, displayName),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', userId], profile)
      queryClient.invalidateQueries({ queryKey: ['set-members'] })
    },
  })
}
