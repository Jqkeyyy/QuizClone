import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as cardsDb from '../lib/db/cards'

export function useCards(setId: string | undefined) {
  return useQuery({
    queryKey: ['cards', setId],
    queryFn: () => cardsDb.listCards(setId as string),
    enabled: !!setId,
  })
}

export function useUpsertCards(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cardsDb.upsertCards,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards', setId] }),
  })
}

export function useBulkInsertCards(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (pairs: Array<{ term: string; definition: string }>) => cardsDb.bulkInsert(setId, pairs),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards', setId] }),
  })
}

export function useDeleteCard(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cardsDb.deleteCard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards', setId] }),
  })
}

export function useReorderCards(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cardsDb.reorder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards', setId] }),
  })
}
