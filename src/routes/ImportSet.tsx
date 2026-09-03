import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useImportSetBackup } from '../hooks/useSet'
import { parseSetBackup, type SetBackup } from '../lib/export/setBackup'

export default function ImportSet() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const importSet = useImportSetBackup()
  const [backup, setBackup] = useState<SetBackup | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  async function selectFile(file: File | undefined) {
    setBackup(null)
    setFileError(null)
    if (!file) return

    try {
      setBackup(parseSetBackup(await file.text()))
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Could not read this backup.')
    }
  }

  function restore() {
    if (!user || !backup) return
    importSet.mutate(
      { userId: user.id, backup },
      { onSuccess: (set) => navigate(`/set/${set.id}`, { replace: true }) },
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-700">← My sets</Link>
        <h1 className="mt-3 text-xl font-semibold text-neutral-900">Import backup</h1>
        <p className="mt-1 text-sm text-neutral-500">Restore a set from a .quizclone.json backup file.</p>
      </div>

      <label className="block space-y-2 rounded-lg border border-dashed border-neutral-300 bg-white p-6">
        <span className="block text-sm font-medium text-neutral-700">Choose backup file</span>
        <input
          type="file"
          accept=".json,.quizclone.json,application/json"
          onChange={(event) => void selectFile(event.target.files?.[0])}
          className="block w-full text-sm text-neutral-600"
        />
      </label>

      {fileError && <p className="text-sm text-red-600">{fileError}</p>}
      {backup && (
        <section className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="font-medium text-neutral-900">{backup.set.title}</h2>
          {backup.set.description && <p className="mt-1 text-sm text-neutral-500">{backup.set.description}</p>}
          <p className="mt-2 text-sm text-neutral-500">{backup.cards.length} cards</p>
          {backup.cards.some((card) => card.term_image || card.definition_image) && (
            <p className="mt-2 text-xs text-amber-700">Card text will be restored; image files are not copied.</p>
          )}
        </section>
      )}

      {importSet.isError && <p className="text-sm text-red-600">Could not restore the set. Please try again.</p>}
      <button
        type="button"
        disabled={!backup || importSet.isPending}
        onClick={restore}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {importSet.isPending ? 'Restoring…' : 'Restore set'}
      </button>
    </div>
  )
}
