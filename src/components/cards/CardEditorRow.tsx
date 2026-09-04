import { useState } from 'react'
import { useRemoveCardImage, useUploadCardImage } from '../../hooks/useCardImages'
import type { CardImageSide } from '../../lib/db/cardImages'
import { CardImage } from './CardImage'

export interface CardEditorRowProps {
  term: string
  definition: string
  cardId: string
  setId: string
  termImage: string | null
  definitionImage: string | null
  onChange: (patch: { term?: string; definition?: string }) => void
  onDelete: () => void
}

export function CardEditorRow({
  term,
  definition,
  cardId,
  setId,
  termImage,
  definitionImage,
  onChange,
  onDelete,
}: CardEditorRowProps) {
  const [localTerm, setLocalTerm] = useState(term)
  const [localDefinition, setLocalDefinition] = useState(definition)
  const uploadImage = useUploadCardImage(setId, cardId)
  const removeImage = useRemoveCardImage(setId, cardId)

  function imageField(side: CardImageSide, path: string | null, label: string) {
    const busy = uploadImage.isPending || removeImage.isPending
    return (
      <div className="mt-2 flex min-h-8 flex-wrap items-center gap-2">
        {path && <CardImage path={path} alt={`${label} image`} className="h-16 w-20 rounded-md object-cover" />}
        <label className="cursor-pointer rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100">
          {path ? 'Replace image' : 'Add image'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={busy}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) uploadImage.mutate({ side, file, previousPath: path })
              event.target.value = ''
            }}
          />
        </label>
        {path && (
          <button
            type="button"
            disabled={busy}
            onClick={() => removeImage.mutate({ side, path })}
            className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Remove image
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <textarea
            value={localTerm}
            onChange={(event) => setLocalTerm(event.target.value)}
            onBlur={() => localTerm !== term && onChange({ term: localTerm })}
            aria-label="Term"
            placeholder="Term"
            rows={2}
            className="w-full resize-none rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500"
          />
          {imageField('term', termImage, 'Term')}
        </div>
        <div>
          <textarea
            value={localDefinition}
            onChange={(event) => setLocalDefinition(event.target.value)}
            onBlur={() => localDefinition !== definition && onChange({ definition: localDefinition })}
            aria-label="Definition"
            placeholder="Definition"
            rows={2}
            className="w-full resize-none rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500"
          />
          {imageField('definition', definitionImage, 'Definition')}
        </div>
      </div>
      {(uploadImage.isError || removeImage.isError) && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {uploadImage.error instanceof Error && uploadImage.error.message.startsWith('Choose')
            ? uploadImage.error.message
            : uploadImage.error instanceof Error && uploadImage.error.message.startsWith('Images')
              ? uploadImage.error.message
              : uploadImage.error instanceof Error && uploadImage.error.message.includes('empty')
                ? uploadImage.error.message
                : 'Could not update the image. Please try again.'}
        </p>
      )}
      {(uploadImage.isPending || removeImage.isPending) && (
        <p role="status" className="mt-2 text-xs text-neutral-500">Saving image…</p>
      )}
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete card"
        className="mt-3 rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
      >
        Delete
      </button>
    </div>
  )
}
