// src/components/cards/CardEditorRow.tsx
import { useState } from 'react'
import type { Database } from '../../types/database'

type Card = Database['public']['Tables']['cards']['Row']

export function CardEditorRow({
  card,
  isFirst,
  isLast,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  card: Card
  isFirst: boolean
  isLast: boolean
  onSave: (patch: { term: string; definition: string }) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [term, setTerm] = useState(card.term)
  const [definition, setDefinition] = useState(card.definition)

  function commit() {
    if (term !== card.term || definition !== card.definition) {
      onSave({ term, definition })
    }
  }

  return (
    <div className="flex items-center gap-2 border-b border-neutral-100 p-2 last:border-b-0">
      <div className="flex flex-col">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label="Move card up"
          className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label="Move card down"
          className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
        >
          ↓
        </button>
      </div>
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onBlur={commit}
        placeholder="Term"
        className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-neutral-500"
      />
      <input
        value={definition}
        onChange={(e) => setDefinition(e.target.value)}
        onBlur={commit}
        placeholder="Definition"
        className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-neutral-500"
      />
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete card"
        className="px-2 text-sm text-red-600 hover:text-red-700"
      >
        ✕
      </button>
    </div>
  )
}
