import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as setsDb from '../lib/db/sets'
import type { Database } from '../types/database'

type SetUpdate = Database['public']['Tables']['sets']['Update']

export function useSets() {
  return useQuery({ queryKey: ['sets'], queryFn: setsDb.listSets })
}

export function useSet(id: string) {
  return useQuery({ queryKey: ['sets', id], queryFn: () => setsDb.getSet(id), enabled: !!id })
}

export function useCreateSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      owner_id: string
      title: string
      description?: string | null
      exam_date?: string | null
    }) => setsDb.createSet(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sets'] }),
  })
}

export function useUpdateSet(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: SetUpdate) => setsDb.updateSet(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sets'] })
      qc.invalidateQueries({ queryKey: ['sets', id] })
    },
  })
}

export function useDeleteSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => setsDb.deleteSet(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sets'] }),
  })
}
