// src/routes/SetEditor.tsx
import { Link, useParams } from 'react-router'
import { useSet } from '../hooks/useSets'
import { useBulkInsertCards, useCards, useDeleteCard, useReorderCards, useUpsertCard } from '../hooks/useCards'
import { CardEditorRow } from '../components/cards/CardEditorRow'
import { BulkImportPanel } from '../components/cards/BulkImportPanel'

export default function SetEditor() {
  const { id } = useParams<{ id: string }>()
  const setId = id!
  const { data: set, isLoading: setLoading } = useSet(setId)
  const { data: cards, isLoading: cardsLoading } = useCards(setId)
  const upsertCard = useUpsertCard(setId)
  const bulkInsertCards = useBulkInsertCards(setId)
  const reorderCards = useReorderCards(setId)
  const deleteCard = useDeleteCard(setId)

  if (setLoading || cardsLoading) return null
  if (!set) return <p className="text-sm text-neutral-500">Set not found.</p>

  const sorted = cards ?? []

  function moveCard(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= sorted.length) return
    const reordered = [...sorted]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)
    reorderCards.mutate(reordered.map((c) => c.id))
  }

  function addBlankCard() {
    upsertCard.mutate({ set_id: setId, term: '', definition: '', position: sorted.length })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">{set.title}</h1>
        <Link
          to={`/set/${setId}`}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
        >
          Done
        </Link>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        {sorted.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">No cards yet.</p>
        ) : (
          sorted.map((card, i) => (
            <CardEditorRow
              key={card.id}
              card={card}
              isFirst={i === 0}
              isLast={i === sorted.length - 1}
              onSave={(patch) => upsertCard.mutate({ id: card.id, set_id: setId, ...patch })}
              onDelete={() => deleteCard.mutate(card.id)}
              onMoveUp={() => moveCard(i, -1)}
              onMoveDown={() => moveCard(i, 1)}
            />
          ))
        )}
        <button
          type="button"
          onClick={addBlankCard}
          className="w-full border-t border-neutral-200 p-2 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          + Add card
        </button>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-700">Bulk paste import</h2>
        <BulkImportPanel importing={bulkInsertCards.isPending} onImport={(rows) => bulkInsertCards.mutate(rows)} />
      </div>
    </div>
  )
}
