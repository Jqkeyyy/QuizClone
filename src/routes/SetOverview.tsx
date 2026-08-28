// src/routes/SetOverview.tsx
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useDeleteSet, useSet } from '../hooks/useSets'
import { useCards } from '../hooks/useCards'

export default function SetOverview() {
  const { id } = useParams<{ id: string }>()
  const setId = id!
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { data: set, isLoading: setLoading } = useSet(setId)
  const { data: cards, isLoading: cardsLoading } = useCards(setId)
  const deleteSet = useDeleteSet()

  if (setLoading || cardsLoading || authLoading) return null
  if (!set) return <p className="text-sm text-neutral-500">Set not found.</p>

  const isOwner = user?.id === set.owner_id

  async function handleDelete() {
    if (!window.confirm(`Delete "${set!.title}"? This can't be undone.`)) return
    await deleteSet.mutateAsync(set!.id)
    navigate('/', { replace: true })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{set.title}</h1>
          {set.description && <p className="mt-1 text-sm text-neutral-500">{set.description}</p>}
          <p className="mt-1 text-sm text-neutral-400">{cards?.length ?? 0} cards</p>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Link
              to={`/set/${set.id}/edit`}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {cards?.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">
            No cards yet
            {isOwner && (
              <>
                {' — '}
                <Link to={`/set/${set.id}/edit`} className="underline">
                  add some
                </Link>
              </>
            )}
            .
          </p>
        ) : (
          cards?.map((c) => (
            <div key={c.id} className="grid grid-cols-2 gap-4 p-3 text-sm">
              <span className="text-neutral-900">{c.term}</span>
              <span className="text-neutral-600">{c.definition}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
