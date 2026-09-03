export interface FlashcardViewProps {
  front: string
  back: string
  flipped: boolean
  starred: boolean
  position: number
  total: number
  onFlip: () => void
  onToggleStar: () => void
}

export function FlashcardView({
  front,
  back,
  flipped,
  starred,
  position,
  total,
  onFlip,
  onToggleStar,
}: FlashcardViewProps) {
  const shown = flipped ? back : front
  const progressPct = total === 0 ? 0 : (position / total) * 100

  return (
    <div className="flex flex-col gap-4">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <div className="h-full bg-neutral-900 transition-all" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="text-sm text-neutral-500">
        {position} / {total}
      </p>

      <button
        type="button"
        onClick={onFlip}
        className="flex min-h-[320px] w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm"
      >
        <span className="text-2xl text-neutral-900">{shown}</span>
      </button>

      <button
        type="button"
        onClick={onToggleStar}
        className={`self-center rounded-md border px-3 py-1 text-sm ${
          starred
            ? 'border-amber-400 bg-amber-50 text-amber-700'
            : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100'
        }`}
      >
        {starred ? '★ Starred' : '☆ Star'}
      </button>
    </div>
  )
}
