export type CachedUserId = string | null | undefined

export function shouldClearUserCache(previousUserId: CachedUserId, nextUserId: string | null): boolean {
  return previousUserId !== undefined && previousUserId !== nextUserId
}
