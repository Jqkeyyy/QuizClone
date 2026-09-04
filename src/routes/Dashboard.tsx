import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { SetCard } from '../components/sets/SetCard'
import { useAuth } from '../hooks/useAuth'
import { useMySets, useSharedSets } from '../hooks/useSet'
import { filterAndSortSets, type SetSort } from '../lib/sets/dashboard'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: mySets = [], isPending: mySetsPending, isError: mySetsError } = useMySets(user?.id)
  const {
    data: sharedSets = [],
    isPending: sharedSetsPending,
    isError: sharedSetsError,
  } = useSharedSets(user?.id)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SetSort>('recent')
  const filteredMySets = useMemo(() => filterAndSortSets(mySets, query, sort), [mySets, query, sort])
  const filteredSharedSets = useMemo(() => filterAndSortSets(sharedSets, query, sort), [query, sharedSets, sort])
  const hasAnySets = mySets.length + sharedSets.length > 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">My sets</h1>
        <div className="flex gap-2">
          <Link to="/set/import" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
            Import backup
          </Link>
          <Link to="/set/new" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
            New set
          </Link>
        </div>
      </div>

      {hasAnySets && (
        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Search sets</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sets"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </label>
          <label>
            <span className="sr-only">Sort sets</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SetSort)}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm sm:w-auto"
            >
              <option value="recent">Recently updated</option>
              <option value="title">Title</option>
              <option value="exam">Exam date</option>
            </select>
          </label>
        </div>
      )}

      {mySetsPending ? (
        <p className="text-sm text-neutral-500">Loading sets…</p>
      ) : mySetsError ? (
        <p className="text-sm text-red-600">Failed to load your sets. Please try again.</p>
      ) : mySets.length === 0 ? (
        <p className="text-sm text-neutral-500">No sets yet — create your first one.</p>
      ) : filteredMySets.length === 0 ? (
        <p className="text-sm text-neutral-500">No owned sets match your search.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMySets.map((set) => <SetCard key={set.id} set={set} />)}
        </div>
      )}

      {sharedSetsPending ? (
        <p className="text-sm text-neutral-500">Loading shared sets…</p>
      ) : sharedSetsError ? (
        <p className="text-sm text-red-600">Failed to load shared sets. Please try again.</p>
      ) : sharedSets.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Shared with me</h2>
          {filteredSharedSets.length === 0 ? (
            <p className="text-sm text-neutral-500">No shared sets match your search.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSharedSets.map((set) => (
                <SetCard key={set.id} set={set} badge={set.member_role === 'editor' ? 'Can edit' : 'View only'} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
