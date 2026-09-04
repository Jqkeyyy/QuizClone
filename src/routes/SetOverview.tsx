import { Link, useNavigate, useParams } from 'react-router'
import { CardImage } from '../components/cards/CardImage'
import { SetSharingPanel } from '../components/sets/SetSharingPanel'
import { useAuth } from '../hooks/useAuth'
import { useCards } from '../hooks/useCards'
import { useRemoveSetMember, useSetMembership } from '../hooks/useSetMembers'
import { useDeleteSet, useSet } from '../hooks/useSet'
import { downloadSetBackup } from '../lib/export/setBackup'

function formatExamDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`))
}

export default function SetOverview() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const { data: set, isPending: setPending, isError: setError } = useSet(id)
  const { data: cards = [], isPending: cardsPending, isError: cardsError } = useCards(id)
  const deleteSet = useDeleteSet()
  const isOwner = !!set && user?.id === set.owner_id
  const shouldLoadMembership = !!set && !isOwner
  const {
    data: membership,
    isPending: membershipPending,
    isError: membershipError,
  } = useSetMembership(id, user?.id, shouldLoadMembership)
  const leaveSet = useRemoveSetMember(id ?? '')
  const navigate = useNavigate()

  if (authLoading || setPending || cardsPending || (shouldLoadMembership && membershipPending)) {
    return <p className="text-sm text-neutral-500">Loading set…</p>
  }
  if (setError || cardsError || (shouldLoadMembership && membershipError)) {
    return <p className="text-sm text-red-600">Couldn't load this set. Try again.</p>
  }
  if (!set) return <p className="text-sm text-neutral-500">Set not found or you don't have access.</p>

  const canEdit = isOwner || membership?.role === 'editor'

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${set!.title}"? This will permanently delete all ${cards.length} cards in this set.`,
    )
    if (!confirmed) return
    deleteSet.mutate(set!.id, {
      onSuccess: () => navigate('/', { replace: true }),
    })
  }

  function handleLeave() {
    if (!user) return
    if (!window.confirm(`Leave ${JSON.stringify(set!.title)}? You will need the owner to share it with you again.`)) return
    leaveSet.mutate(user.id, {
      onSuccess: () => navigate('/', { replace: true }),
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{set.title}</h1>
          {set.description && <p className="mt-1 text-sm text-neutral-500">{set.description}</p>}
          {set.exam_date && <p className="mt-1 text-sm text-neutral-500">Exam: {formatExamDate(set.exam_date)}</p>}
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
          <Link to={`/set/${set.id}/stats`} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100">
            Progress
          </Link>
          <button
            type="button"
            onClick={() => downloadSetBackup(set, cards)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
          >
            Export backup
          </button>
          {canEdit && (
            <Link to={`/set/${set.id}/edit`} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100">Edit</Link>
          )}
          {isOwner ? (
            <>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteSet.isPending}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {deleteSet.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={leaveSet.isPending}
              onClick={handleLeave}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
            >
              {leaveSet.isPending ? 'Leaving…' : 'Leave set'}
            </button>
          )}
        </div>
      </div>

      {leaveSet.isError && <p role="alert" className="text-sm text-red-600">Could not leave this set. Please try again.</p>}
      {deleteSet.isError && <p role="alert" className="text-sm text-red-600">Could not delete this set. Please try again.</p>}

      {isOwner && <SetSharingPanel setId={set.id} />}

      <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {cards.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-500">
            No cards yet{canEdit ? <> — <Link to={`/set/${set.id}/edit`} className="underline">add some</Link></> : ''}.
          </p>
        ) : cards.map((card) => (
          <div key={card.id} className="grid grid-cols-2 gap-4 px-4 py-3 text-sm">
            <div className="space-y-2">
              <CardImage path={card.term_image} alt="Term illustration" className="h-20 w-full rounded-md object-contain object-left" />
              <span className="block">{card.term}</span>
            </div>
            <div className="space-y-2 text-neutral-600">
              <CardImage path={card.definition_image} alt="Definition illustration" className="h-20 w-full rounded-md object-contain object-left" />
              <span className="block">{card.definition}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
