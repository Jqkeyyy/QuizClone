import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useCreateSet } from '../hooks/useSet'

export default function NewSet() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const createSet = useCreateSet()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [examDate, setExamDate] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    createSet.mutate(
      {
        owner_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        exam_date: examDate || null,
      },
      {
        onSuccess: (set) => navigate(`/set/${set.id}/edit`, { replace: true }),
      },
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-semibold text-neutral-900">New set</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-neutral-700">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Set title"
            required
            autoFocus
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-neutral-700">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional notes about this set"
            rows={3}
            className="w-full resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-neutral-700">Exam date</span>
          <input
            type="date"
            value={examDate}
            onChange={(event) => setExamDate(event.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          <span className="block text-xs text-neutral-500">Optional. Learn mode schedules reviews around this date.</span>
        </label>
        {createSet.isError && <p className="text-sm text-red-600">Could not create the set. Please try again.</p>}
        <button
          type="submit"
          disabled={createSet.isPending || title.trim().length === 0}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {createSet.isPending ? 'Creating…' : 'Create and add cards'}
        </button>
      </form>
    </div>
  )
}
