import { CardImage } from '../cards/CardImage'

export interface FlashcardViewProps {
  front: string
  back: string
  frontImage?: string | null
  backImage?: string | null
  flipped: boolean
  starred: boolean
  position: number
  total: number
  onFlip: () => void
  onToggleStar: () => void
  onPrevious: () => void
  onNext: () => void
  canGoPrevious: boolean
  canGoNext: boolean
}

export function FlashcardView({
  front,
  back,
  frontImage,
  backImage,
  flipped,
  starred,
  position,
  total,
  onFlip,
  onToggleStar,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: FlashcardViewProps) {
  const shown = flipped ? back : front
  const shownImage = flipped ? backImage : frontImage
  const progressPct = total === 0 ? 0 : (position / total) * 100

  return (
    <div className="flex flex-col gap-4">
      <div
        role="progressbar"
        aria-label="Cards reviewed"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={position}
        className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200"
      >
        <div className="h-full bg-neutral-900 transition-all" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="text-sm text-neutral-500">
        {position} / {total}
      </p>

      <button
        type="button"
        onClick={onFlip}
        aria-pressed={flipped}
        aria-keyshortcuts="Space"
        className="flex min-h-[320px] w-full flex-col items-center justify-center gap-5 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm"
      >
        <CardImage path={shownImage} alt="Card illustration" className="max-h-52 max-w-full rounded-lg object-contain" />
        <span className="text-2xl text-neutral-900">{shown}</span>
      </button>

      <div className="grid grid-cols-3 items-center gap-3">
        <button
          type="button"
          disabled={!canGoPrevious}
          onClick={onPrevious}
          aria-keyshortcuts="ArrowLeft"
          className="justify-self-start rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={onToggleStar}
          aria-pressed={starred}
          aria-keyshortcuts="S"
          className={`justify-self-center rounded-md border px-3 py-2 text-sm ${
            starred
              ? 'border-amber-400 bg-amber-50 text-amber-700'
              : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          {starred ? '★ Starred' : '☆ Star'}
        </button>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={onNext}
          aria-keyshortcuts="ArrowRight"
          className="justify-self-end rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
