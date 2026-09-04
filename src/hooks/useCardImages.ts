import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as imagesDb from '../lib/db/cardImages'
import type { CardImageSide } from '../lib/db/cardImages'

export function useCardImageUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['card-image', path],
    queryFn: () => imagesDb.createCardImageUrl(path as string),
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
  })
}

export function useUploadCardImage(setId: string, cardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ side, file, previousPath }: {
      side: CardImageSide
      file: File
      previousPath: string | null
    }) => imagesDb.uploadCardImage(setId, cardId, side, file, previousPath),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['cards', setId] }),
  })
}

export function useRemoveCardImage(setId: string, cardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ side, path }: { side: CardImageSide; path: string }) =>
      imagesDb.removeCardImage(setId, cardId, side, path),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['cards', setId] }),
  })
}
