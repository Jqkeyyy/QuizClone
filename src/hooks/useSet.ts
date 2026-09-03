import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as setsDb from '../lib/db/sets'
import type { Database } from '../types/database'
import type { SetBackup } from '../lib/export/setBackup'
import * as cardsDb from '../lib/db/cards'

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

export function useImportSetBackup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, backup }: { userId: string; backup: SetBackup }) => {
      const created = await setsDb.createSet({
        owner_id: userId,
        title: backup.set.title,
        description: backup.set.description,
        exam_date: backup.set.exam_date,
      })

      try {
        if (backup.cards.length > 0) {
          await cardsDb.bulkInsert(
            created.id,
            backup.cards.map(({ term, definition }) => ({ term, definition })),
          )
        }
      } catch (error) {
        await setsDb.deleteSet(created.id)
        throw error
      }

      return created
    },
    onSuccess: (created: SetRow) => {
      queryClient.invalidateQueries({ queryKey: ['sets', 'mine', created.owner_id] })
    },
  })
}
