import { useState } from 'react'

export interface CardEditorRowProps {
  term: string
  definition: string
  onChange: (patch: { term?: string; definition?: string }) => void
  onDelete: () => void
}

export function CardEditorRow({ term, definition, onChange, onDelete }: CardEditorRowProps) {
  const [localTerm, setLocalTerm] = useState(term)
  const [localDefinition, setLocalDefinition] = useState(definition)

  return (
    <div className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-white p-3">
      <textarea
        value={localTerm}
        onChange={(event) => setLocalTerm(event.target.value)}
        onBlur={() => localTerm !== term && onChange({ term: localTerm })}
        placeholder="Term"
        rows={2}
        className="flex-1 resize-none rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500"
      />
      <textarea
        value={localDefinition}
        onChange={(event) => setLocalDefinition(event.target.value)}
        onBlur={() => localDefinition !== definition && onChange({ definition: localDefinition })}
        placeholder="Definition"
        rows={2}
        className="flex-1 resize-none rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500"
      />
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete card"
        className="mt-1 shrink-0 rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
      >
        Delete
      </button>
    </div>
  )
}
