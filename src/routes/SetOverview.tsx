import { Link, useNavigate, useParams } from 'react-router'
import { useSet, useDeleteSet } from '../hooks/useSet'
import { useCards } from '../hooks/useCards'

export default function SetOverview() {
  const { id } = useParams<{ id: string }>()
  const { data: set, isPending, isError } = useSet(id)
  const { data: cards = [] } = useCards(id)
  const deleteSet = useDeleteSet()
  const navigate = useNavigate()

  if (isPending) {
    return <p className="text-sm text-neutral-500">Loading set…</p>
  }

  if (isError) {
    return <p className="text-sm text-red-600">Set not found or you don't have access.</p>
  }

  function handleDelete() {
    if (!set) return
    const confirmed = window.confirm(
      `Delete "${set.title}"? This will permanently delete all ${cards.length} cards in this set.`,
    )
    if (!confirmed) return
    deleteSet.mutate(set.id, {
      onSuccess: () => navigate('/', { replace: true }),
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{set.title}</h1>
          <p className="text-sm text-neutral-500">{cards.length} cards</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/set/${set.id}/edit`}
            className="rounded-md border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
          >
            Delete set
          </button>
        </div>
      </div>

      <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {cards.map((card) => (
          <div key={card.id} className="grid grid-cols-2 gap-4 px-4 py-3 text-sm">
            <span>{card.term}</span>
            <span className="text-neutral-600">{card.definition}</span>
          </div>
        ))}
        {cards.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-neutral-500">No cards yet — add some in the editor.</p>
        )}
      </div>
    </div>
  )
}
