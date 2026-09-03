import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as progressDb from '../lib/db/progress'

export function useStarredCardIds(userId: string | undefined, setId: string | undefined) {
  return useQuery({
    queryKey: ['progress', 'starred', setId, userId],
    queryFn: () => progressDb.getStarredCardIds(userId as string, setId as string),
    enabled: !!userId && !!setId,
  })
}

export function useSetStarred(userId: string | undefined, setId: string | undefined) {
  const queryClient = useQueryClient()
  const queryKey = ['progress', 'starred', setId, userId]

  return useMutation({
    mutationFn: ({ cardId, starred }: { cardId: string; starred: boolean }) =>
      progressDb.setStarred(userId as string, cardId, setId as string, starred),
    onMutate: async ({ cardId, starred }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<string[]>(queryKey)
      queryClient.setQueryData<string[]>(queryKey, (old = []) =>
        starred ? [...old, cardId] : old.filter((id) => id !== cardId),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
