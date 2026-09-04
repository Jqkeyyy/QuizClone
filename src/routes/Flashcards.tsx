import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useSet } from '../hooks/useSet'
import { useCards } from '../hooks/useCards'
import { useStarredCardIds, useSetStarred } from '../hooks/useProgress'
import { useKeyboard } from '../hooks/useKeyboard'
import { shuffle } from '../lib/study/shuffle'
import { FlashcardView } from '../components/study/FlashcardView'

export default function Flashcards() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data: set, isPending: setPending, isError: setError } = useSet(id)
  const { data: cards = [], isPending: cardsPending, isError: cardsError } = useCards(id)
  const { data: starredIds = [] } = useStarredCardIds(user?.id, id)
  const setStarred = useSetStarred(user?.id, id)

  const [startWith, setStartWith] = useState<'term' | 'definition'>('term')
  const [shuffleOn, setShuffleOn] = useState(false)
  const [starredOnly, setStarredOnly] = useState(false)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const starredSet = useMemo(() => new Set(starredIds), [starredIds])

  // `filtered` only changes identity when starredOnly is on (membership can change
  // on a star toggle) or when cards/starredOnly themselves change — when starredOnly
  // is off it stays === cards, so starring a card never re-triggers the shuffle below.
  const filtered = useMemo(
    () => (starredOnly ? cards.filter((c) => starredSet.has(c.id)) : cards),
    [cards, starredOnly, starredSet],
  )
  const deck = useMemo(() => (shuffleOn ? shuffle(filtered) : filtered), [filtered, shuffleOn])

  const safeIndex = Math.min(index, Math.max(deck.length - 1, 0))
  const current = deck[safeIndex]

  function goTo(next: number) {
    if (next < 0 || next >= deck.length) return
    setIndex(next)
    setFlipped(false)
  }

  function toggleStar() {
    if (!current || setStarred.isPending) return
    setStarred.mutate({ cardId: current.id, starred: !starredSet.has(current.id) })
    if (starredOnly) setFlipped(false)
  }

  useKeyboard({
    ' ': () => setFlipped((f) => !f),
    ArrowLeft: () => goTo(safeIndex - 1),
    ArrowRight: () => goTo(safeIndex + 1),
    s: toggleStar,
    S: toggleStar,
  })

  if (setPending || cardsPending) {
    return <p className="text-sm text-neutral-500">Loading…</p>
  }

  if (setError || cardsError || !set) {
    return <p className="text-sm text-red-600">Set not found or you don't have access.</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to={`/set/${id}`} className="text-sm text-neutral-500 hover:text-neutral-700">
        ← {set.title}
      </Link>

      <div className="flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          aria-pressed={shuffleOn}
          onClick={() => {
            setStartWith((value) => (value === 'term' ? 'definition' : 'term'))
            setFlipped(false)
          }}
          className="rounded-md border border-neutral-300 px-3 py-1 hover:bg-neutral-100"
        >
          Start with: {startWith === 'term' ? 'Term' : 'Definition'}
        </button>
        <button
          type="button"
          aria-pressed={starredOnly}
          onClick={() => {
            setShuffleOn((value) => !value)
            setIndex(0)
            setFlipped(false)
          }}
          className={`rounded-md border px-3 py-1 ${
            shuffleOn ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 hover:bg-neutral-100'
          }`}
        >
          Shuffle
        </button>
        <button
          type="button"
          onClick={() => {
            setStarredOnly((value) => !value)
            setIndex(0)
            setFlipped(false)
          }}
          className={`rounded-md border px-3 py-1 ${
            starredOnly
              ? 'border-amber-400 bg-amber-50 text-amber-700'
              : 'border-neutral-300 hover:bg-neutral-100'
          }`}
        >
          Starred only
        </button>
      </div>

      {deck.length === 0 || !current ? (
        <p className="text-sm text-neutral-500">
          {starredOnly ? 'No starred cards yet.' : 'No cards in this set yet.'}
        </p>
      ) : (
        <FlashcardView
          front={startWith === 'term' ? current.term : current.definition}
          back={startWith === 'term' ? current.definition : current.term}
          frontImage={startWith === 'term' ? current.term_image : current.definition_image}
          backImage={startWith === 'term' ? current.definition_image : current.term_image}
          flipped={flipped}
          starred={starredSet.has(current.id)}
          position={safeIndex + 1}
          total={deck.length}
          onFlip={() => setFlipped((f) => !f)}
          onToggleStar={toggleStar}
          onPrevious={() => goTo(safeIndex - 1)}
          onNext={() => goTo(safeIndex + 1)}
          canGoPrevious={safeIndex > 0}
          canGoNext={safeIndex < deck.length - 1}
        />
      )}

      <p className="text-center text-xs text-neutral-400">Space to flip · ← → to move · S to star</p>
    </div>
  )
}
