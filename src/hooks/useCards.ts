import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as cardsDb from '../lib/db/cards'
import type { Database } from '../types/database'

type CardInsert = Database['public']['Tables']['cards']['Insert']

export function useCards(setId: string) {
  return useQuery({ queryKey: ['cards', setId], queryFn: () => cardsDb.listCards(setId), enabled: !!setId })
}

export function useUpsertCard(setId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (card: CardInsert) => cardsDb.upsertCard(card),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards', setId] }),
  })
}

export function useBulkInsertCards(setId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rows: { term: string; definition: string }[]) => cardsDb.bulkInsertCards(setId, rows),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards', setId] }),
  })
}

export function useReorderCards(setId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => cardsDb.reorderCards(orderedIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards', setId] }),
  })
}

export function useDeleteCard(setId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cardsDb.deleteCard(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards', setId] }),
  })
}
