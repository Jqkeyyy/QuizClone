import { Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useSets } from '../hooks/useSets'
import { SetCard } from '../components/sets/SetCard'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: sets, isLoading } = useSets()

  if (isLoading) return null

  const mySets = sets?.filter((s) => s.owner_id === user?.id) ?? []
  const sharedSets = sets?.filter((s) => s.owner_id !== user?.id) ?? []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">My sets</h1>
        <Link
          to="/set/new"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          New set
        </Link>
      </div>

      {mySets.length === 0 ? (
        <p className="text-sm text-neutral-500">No sets yet — create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mySets.map((s) => (
            <SetCard key={s.id} set={s} />
          ))}
        </div>
      )}

      {sharedSets.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Shared with me</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sharedSets.map((s) => (
              <SetCard key={s.id} set={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
