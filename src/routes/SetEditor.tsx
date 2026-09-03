import { Link, useParams } from 'react-router'
import { BulkImportPanel } from '../components/cards/BulkImportPanel'
import { CardEditorRow } from '../components/cards/CardEditorRow'
import { useBulkInsertCards, useCards, useDeleteCard, useReorderCards, useUpsertCards } from '../hooks/useCards'
import { useSet, useUpdateSet } from '../hooks/useSet'

export default function SetEditor() {
  const { id } = useParams<{ id: string }>()
  const setId = id ?? ''
  const { data: set, isPending: setPending, isError: setError } = useSet(id)
  const { data: cards = [], isPending: cardsPending, isError: cardsError } = useCards(id)
  const updateSet = useUpdateSet(setId)
  const upsertCards = useUpsertCards(setId)
  const bulkInsertCards = useBulkInsertCards(setId)
  const deleteCard = useDeleteCard(setId)
  const reorderCards = useReorderCards(setId)

  if (setPending || cardsPending) return <p className="text-sm text-neutral-500">Loading set…</p>
  if (setError || cardsError) return <p className="text-sm text-red-600">Couldn't load this set. Try again.</p>
  if (!set) return <p className="text-sm text-neutral-500">Set not found or you don't have access.</p>

  function handleAddCard() {
    const nextPosition = cards.length === 0 ? 0 : Math.max(...cards.map((card) => card.position)) + 1
    upsertCards.mutate([{ set_id: setId, term: '', definition: '', position: nextPosition }])
  }

  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= cards.length) return
    const currentCard = cards[index]
    const targetCard = cards[target]
    reorderCards.mutate([
      { id: currentCard.id, position: targetCard.position },
      { id: targetCard.id, position: currentCard.position },
    ])
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <input
          defaultValue={set.title}
          onBlur={(event) => {
            const value = event.target.value.trim()
            if (!value) {
              event.target.value = set.title
            } else if (value !== set.title) {
              updateSet.mutate({ title: value })
            }
          }}
          aria-label="Set title"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-lg font-semibold outline-none focus:border-neutral-500"
        />
        <Link to={`/set/${setId}`} className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100">
          Done
        </Link>
      </div>

      <section className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-2">
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-neutral-700">Description</span>
          <textarea
            defaultValue={set.description ?? ''}
            onBlur={(event) => {
              const value = event.target.value.trim() || null
              if (value !== set.description) updateSet.mutate({ description: value })
            }}
            placeholder="Optional notes about this set"
            rows={3}
            className="w-full resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-neutral-700">Exam date</span>
          <input
            type="date"
            defaultValue={set.exam_date ?? ''}
            onBlur={(event) => {
              const value = event.target.value || null
              if (value !== set.exam_date) updateSet.mutate({ exam_date: value })
            }}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </label>
        <div className="self-end pb-2 text-xs text-neutral-500">
          {updateSet.isPending ? 'Saving set details…' : 'Changes save when you leave a field.'}
        </div>
        {updateSet.isError && <p className="text-sm text-red-600 sm:col-span-2">Could not save the set details. Please try again.</p>}
      </section>

      <div className="space-y-2">
        {cards.map((card, index) => (
          <div key={card.id} className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <button type="button" onClick={() => handleMove(index, -1)} disabled={index === 0} aria-label="Move card up" className="text-xs text-neutral-400 disabled:opacity-30">▲</button>
              <button type="button" onClick={() => handleMove(index, 1)} disabled={index === cards.length - 1} aria-label="Move card down" className="text-xs text-neutral-400 disabled:opacity-30">▼</button>
            </div>
            <div className="flex-1">
              <CardEditorRow
                term={card.term}
                definition={card.definition}
                onChange={(patch) => upsertCards.mutate([{ id: card.id, set_id: setId, term: patch.term ?? card.term, definition: patch.definition ?? card.definition }])}
                onDelete={() => deleteCard.mutate(card.id)}
              />
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={handleAddCard} className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
        + Add card
      </button>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-700">Bulk paste import</h2>
        <BulkImportPanel importing={bulkInsertCards.isPending} onImport={(pairs) => bulkInsertCards.mutate(pairs)} />
      </section>
    </div>
  )
}
