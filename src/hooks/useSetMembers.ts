import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database } from '../types/database'
import * as membersDb from '../lib/db/members'

type MemberRole = Database['public']['Tables']['set_members']['Row']['role']

export function useSetMembers(setId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['set-members', setId],
    queryFn: () => membersDb.listSetMembers(setId as string),
    enabled: !!setId && enabled,
  })
}

export function useSetMembership(setId: string | undefined, userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['set-membership', setId, userId],
    queryFn: () => membersDb.getSetMembership(setId as string, userId as string),
    enabled: !!setId && !!userId && enabled,
  })
}

export function useAddSetMember(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: MemberRole }) =>
      membersDb.addMemberByEmail(setId, email, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['set-members', setId] }),
  })
}

export function useUpdateSetMemberRole(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: MemberRole }) =>
      membersDb.updateMemberRole(setId, userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['set-members', setId] }),
  })
}

export function useRemoveSetMember(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => membersDb.removeMember(setId, userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['set-members', setId] })
      queryClient.invalidateQueries({ queryKey: ['set-membership', setId, userId] })
      queryClient.invalidateQueries({ queryKey: ['sets'] })
    },
  })
}
