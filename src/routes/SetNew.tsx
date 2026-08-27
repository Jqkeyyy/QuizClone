// src/routes/SetNew.tsx
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useCreateSet } from '../hooks/useSets'

export default function SetNew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const createSet = useCreateSet()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [examDate, setExamDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    try {
      const set = await createSet.mutateAsync({
        owner_id: user.id,
        title,
        description: description || null,
        exam_date: examDate || null,
      })
      navigate(`/set/${set.id}/edit`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create set')
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-lg font-semibold text-neutral-900">New set</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          autoFocus
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <label className="block text-sm text-neutral-600">
          Exam date (optional)
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={createSet.isPending}
          className="w-full rounded-md bg-neutral-900 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {createSet.isPending ? 'Creating…' : 'Create set'}
        </button>
      </form>
    </div>
  )
}
