import { Link } from 'react-router'
import type { Database } from '../../types/database'

type SetRow = Database['public']['Tables']['sets']['Row']

export function SetCard({ set, badge }: { set: SetRow; badge?: string }) {
  return (
    <Link
      to={`/set/${set.id}`}
      className="block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-neutral-900">{set.title}</h3>
        {badge && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">{badge}</span>}
      </div>
      {set.description && <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{set.description}</p>}
      {set.exam_date && <p className="mt-2 text-xs text-neutral-400">Exam {set.exam_date}</p>}
    </Link>
  )
}
