import { useCardImageUrl } from '../../hooks/useCardImages'

export function CardImage({
  path,
  alt,
  className = 'max-h-48 max-w-full rounded-md object-contain',
}: {
  path: string | null | undefined
  alt: string
  className?: string
}) {
  const { data: url, isPending, isError } = useCardImageUrl(path)

  if (!path) return null
  if (isPending) return <div className="h-20 w-20 animate-pulse rounded-md bg-neutral-100" aria-label="Loading image" />
  if (isError || !url) return <p className="text-xs text-red-600">Image unavailable</p>
  return <img src={url} alt={alt} loading="lazy" className={className} />
}
