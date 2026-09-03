import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useCards } from '../hooks/useCards'
import { useDeleteSet, useSet } from '../hooks/useSet'

export default function SetOverview() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const { data: set, isPending: setPending, isError: setError } = useSet(id)
  const { data: cards = [], isPending: cardsPending, isError: cardsError } = useCards(id)
  const deleteSet = useDeleteSet()
  const navigate = useNavigate()

  if (authLoading || setPending || cardsPending) return <p className="text-sm text-neutral-500">Loading set…</p>
  if (setError || cardsError) return <p className="text-sm text-red-600">Couldn't load this set. Try again.</p>
  if (!set) return <p className="text-sm text-neutral-500">Set not found or you don't have access.</p>

  const isOwner = user?.id === set.owner_id

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${set!.title}"? This will permanently delete all ${cards.length} cards in this set.`,
    )
    if (!confirmed) return
    deleteSet.mutate(set!.id, {
      onSuccess: () => navigate('/', { replace: true }),
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{set.title}</h1>
          {set.description && <p className="mt-1 text-sm text-neutral-500">{set.description}</p>}
          <p className="mt-1 text-sm text-neutral-400">{cards.length} cards</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Link to={`/set/${set.id}/flashcards`} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800">
            Flashcards
          </Link>
          <Link to={`/set/${set.id}/learn`} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100">
            Learn
          </Link>
          <Link to={`/set/${set.id}/test`} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100">
            Test
          </Link>
          {isOwner && (
            <>
              <Link to={`/set/${set.id}/edit`} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100">Edit</Link>
              <button type="button" onClick={handleDelete} className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Delete</button>
            </>
          )}
        </div>
      </div>

      <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {cards.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-500">
            No cards yet{isOwner ? <> — <Link to={`/set/${set.id}/edit`} className="underline">add some</Link></> : ''}.
          </p>
        ) : cards.map((card) => (
          <div key={card.id} className="grid grid-cols-2 gap-4 px-4 py-3 text-sm">
            <span>{card.term}</span>
            <span className="text-neutral-600">{card.definition}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
