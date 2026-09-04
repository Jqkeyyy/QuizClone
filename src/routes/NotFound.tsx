import { Link } from 'react-router'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-medium text-neutral-400">404</p>
      <h1 className="mt-2 text-xl font-semibold text-neutral-900">Page not found</h1>
      <p className="mt-2 text-sm text-neutral-500">The page may have moved, or the address may be incorrect.</p>
      <Link to="/" className="mt-5 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
        Return to my sets
      </Link>
    </div>
  )
}
