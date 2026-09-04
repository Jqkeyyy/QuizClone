import { useQuery } from '@tanstack/react-query'
import { listStudySessions } from '../lib/db/studySessions'

export function useStudySessions(userId: string | undefined, setId: string | undefined) {
  return useQuery({
    queryKey: ['study-sessions', setId, userId],
    queryFn: () => listStudySessions(userId as string, setId as string),
    enabled: !!userId && !!setId,
  })
}
