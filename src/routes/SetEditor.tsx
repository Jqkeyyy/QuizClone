import { Link, useParams } from 'react-router'
import { BulkImportPanel } from '../components/cards/BulkImportPanel'
import { CardEditorRow } from '../components/cards/CardEditorRow'
import { useAuth } from '../hooks/useAuth'
import {
  useBulkInsertCards,
  useCards,
  useCreateCard,
  useDeleteCard,
  useReorderCards,
  useUpdateCard,
} from '../hooks/useCards'
import { useSetMembership } from '../hooks/useSetMembers'
import { useSet, useUpdateSet } from '../hooks/useSet'

export default function SetEditor() {
  const { id } = useParams<{ id: string }>()
  const setId = id ?? ''
  const { user, loading: authLoading } = useAuth()
  const { data: set, isPending: setPending, isError: setError } = useSet(id)
  const { data: cards = [], isPending: cardsPending, isError: cardsError } = useCards(id)
  const isOwner = !!set && user?.id === set.owner_id
  const shouldLoadMembership = !!set && !isOwner
  const { data: membership, isPending: membershipPending, isError: membershipError } = useSetMembership(
    id,
    user?.id,
    shouldLoadMembership,
  )
  const updateSet = useUpdateSet(setId)
  const createCard = useCreateCard(setId)
  const updateCard = useUpdateCard(setId)
  const bulkInsertCards = useBulkInsertCards(setId)
  const deleteCard = useDeleteCard(setId)
  const reorderCards = useReorderCards(setId)

  if (authLoading || setPending || cardsPending || (shouldLoadMembership && membershipPending)) {
    return <p className="text-sm text-neutral-500">Loading set…</p>
  }
  if (setError || cardsError || (shouldLoadMembership && membershipError)) {
    return <p className="text-sm text-red-600">Couldn't load this set. Try again.</p>
  }
  if (!set) return <p className="text-sm text-neutral-500">Set not found or you don't have access.</p>
  if (!isOwner && membership?.role !== 'editor') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-neutral-600">You have view-only access to this set.</p>
        <Link to={`/set/${setId}`} className="text-sm font-medium underline">Return to the set</Link>
      </div>
    )
  }

  function handleAddCard() {
    const nextPosition = cards.length === 0 ? 0 : Math.max(...cards.map((card) => card.position)) + 1
    createCard.mutate({ set_id: setId, term: '', definition: '', position: nextPosition })
  }

  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= cards.length) return
    const currentCard = cards[index]
    const targetCard = cards[target]
    reorderCards.mutate({ firstCardId: currentCard.id, secondCardId: targetCard.id })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        {isOwner ? (
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
        ) : (
          <h1 className="w-full text-xl font-semibold text-neutral-900">{set.title}</h1>
        )}
        <Link to={`/set/${setId}`} className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100">
          Done
        </Link>
      </div>

      {isOwner ? (
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
      ) : (
        <p className="text-sm text-neutral-500">You can edit cards in this shared set. Only the owner can change set details.</p>
      )}

      <div className="space-y-2">
        {cards.map((card, index) => (
          <div key={card.id} className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <button type="button" onClick={() => handleMove(index, -1)} disabled={index === 0 || reorderCards.isPending} aria-label="Move card up" className="text-xs text-neutral-400 disabled:opacity-30">▲</button>
              <button type="button" onClick={() => handleMove(index, 1)} disabled={index === cards.length - 1 || reorderCards.isPending} aria-label="Move card down" className="text-xs text-neutral-400 disabled:opacity-30">▼</button>
            </div>
            <div className="flex-1">
              <CardEditorRow
                cardId={card.id}
                setId={setId}
                term={card.term}
                definition={card.definition}
                termImage={card.term_image}
                definitionImage={card.definition_image}
                onChange={(patch) => updateCard.mutate({ id: card.id, patch })}
                onDelete={() => {
                  const label = card.term.trim() || card.definition.trim() || 'this blank card'
                  if (window.confirm(`Delete ${JSON.stringify(label)}?`)) deleteCard.mutate(card.id)
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={createCard.isPending}
          onClick={handleAddCard}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
        >
          {createCard.isPending ? 'Adding…' : '+ Add card'}
        </button>
        {(updateCard.isPending || deleteCard.isPending || reorderCards.isPending) && (
          <span role="status" className="text-xs text-neutral-500">Saving card changes…</span>
        )}
      </div>

      {(createCard.isError || updateCard.isError || deleteCard.isError || reorderCards.isError || bulkInsertCards.isError) && (
        <p role="alert" className="text-sm text-red-600">Could not save the card changes. Please try again.</p>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-700">Bulk paste import</h2>
        <BulkImportPanel importing={bulkInsertCards.isPending} onImport={(pairs) => bulkInsertCards.mutateAsync(pairs).then(() => undefined)} />
      </section>
    </div>
  )
}
