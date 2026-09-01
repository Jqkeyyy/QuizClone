import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as setsDb from '../lib/db/sets'
import type { Database } from '../types/database'

type SetRow = Database['public']['Tables']['sets']['Row']
type SetInsert = Database['public']['Tables']['sets']['Insert']
type SetUpdate = Database['public']['Tables']['sets']['Update']

export function useMySets(userId: string | undefined) {
  return useQuery({
    queryKey: ['sets', 'mine', userId],
    queryFn: () => setsDb.listMySets(userId as string),
    enabled: !!userId,
  })
}

export function useSharedSets(userId: string | undefined) {
  return useQuery({
    queryKey: ['sets', 'shared', userId],
    queryFn: () => setsDb.listSharedSets(userId as string),
    enabled: !!userId,
  })
}

export function useSet(setId: string | undefined) {
  return useQuery({
    queryKey: ['sets', setId],
    queryFn: () => setsDb.getSet(setId as string),
    enabled: !!setId,
  })
}

export function useCreateSet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Pick<SetInsert, 'owner_id' | 'title' | 'description' | 'exam_date'>) =>
      setsDb.createSet(input),
    onSuccess: (created: SetRow) => {
      queryClient.invalidateQueries({ queryKey: ['sets', 'mine', created.owner_id] })
    },
  })
}

export function useUpdateSet(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: SetUpdate) => setsDb.updateSet(setId, patch),
    onSuccess: (updated: SetRow) => {
      queryClient.setQueryData(['sets', setId], updated)
      queryClient.invalidateQueries({ queryKey: ['sets', 'mine', updated.owner_id] })
    },
  })
}

export function useDeleteSet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (setId: string) => setsDb.deleteSet(setId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sets'] })
    },
  })
}
