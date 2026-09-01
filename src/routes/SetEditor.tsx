import { useParams } from 'react-router'
import { useCards, useUpsertCards, useBulkInsertCards, useDeleteCard, useReorderCards } from '../hooks/useCards'
import { useSet, useUpdateSet } from '../hooks/useSet'
import { CardEditorRow } from '../components/cards/CardEditorRow'
import { BulkImportPanel } from '../components/cards/BulkImportPanel'

export default function SetEditor() {
  const { id } = useParams<{ id: string }>()
  const { data: set } = useSet(id)
  const { data: cards = [] } = useCards(id)
  const updateSet = useUpdateSet(id as string)
  const upsertCards = useUpsertCards(id as string)
  const bulkInsertCards = useBulkInsertCards(id as string)
  const deleteCard = useDeleteCard(id as string)
  const reorderCards = useReorderCards(id as string)

  if (!set) return null

  function handleAddCard() {
    const nextPosition = cards.length === 0 ? 0 : Math.max(...cards.map((c) => c.position)) + 1
    upsertCards.mutate([{ set_id: id as string, term: '', definition: '', position: nextPosition }])
  }

  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= cards.length) return
    const a = cards[index]
    const b = cards[target]
    reorderCards.mutate([
      { id: a.id, position: b.position },
      { id: b.id, position: a.position },
    ])
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <input
        defaultValue={set.title}
        onBlur={(e) => {
          if (e.target.value !== set.title) updateSet.mutate({ title: e.target.value })
        }}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-lg font-semibold outline-none focus:border-neutral-500"
      />

      <div className="space-y-2">
        {cards.map((card, i) => (
          <div key={card.id} className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleMove(i, -1)}
                disabled={i === 0}
                className="text-xs text-neutral-400 disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => handleMove(i, 1)}
                disabled={i === cards.length - 1}
                className="text-xs text-neutral-400 disabled:opacity-30"
              >
                ▼
              </button>
            </div>
            <div className="flex-1">
              <CardEditorRow
                term={card.term}
                definition={card.definition}
                onChange={(patch) =>
                  upsertCards.mutate([
                    {
                      id: card.id,
                      set_id: id as string,
                      term: patch.term ?? card.term,
                      definition: patch.definition ?? card.definition,
                    },
                  ])
                }
                onDelete={() => deleteCard.mutate(card.id)}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddCard}
        className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
      >
        + Add card
      </button>

      <BulkImportPanel onImport={(pairs) => bulkInsertCards.mutate(pairs)} />
    </div>
  )
}
