// src/components/sets/SetCard.tsx
import { Link } from 'react-router'
import type { Database } from '../../types/database'

type Set = Database['public']['Tables']['sets']['Row']

export function SetCard({ set }: { set: Set }) {
  return (
    <Link
      to={`/set/${set.id}`}
      className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:shadow-sm"
    >
      <h3 className="font-medium text-neutral-900">{set.title}</h3>
      {set.description && <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{set.description}</p>}
    </Link>
  )
}
