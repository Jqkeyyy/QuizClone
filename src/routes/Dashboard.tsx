import { Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useMySets, useSharedSets } from '../hooks/useSet'
import { SetCard } from '../components/sets/SetCard'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: mySets = [] } = useMySets(user?.id)
  const { data: sharedSets = [] } = useSharedSets(user?.id)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">My sets</h1>
        <Link to="/set/new" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          New set
        </Link>
      </div>

      {mySets.length === 0 ? (
        <p className="text-sm text-neutral-500">No sets yet — create your first one.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mySets.map((set) => (
            <SetCard key={set.id} set={set} />
          ))}
        </div>
      )}

      {sharedSets.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-neutral-900">Shared with me</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sharedSets.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
