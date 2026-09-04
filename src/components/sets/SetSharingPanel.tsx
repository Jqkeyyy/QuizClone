import { useState, type FormEvent } from 'react'
import type { Database } from '../../types/database'
import {
  useAddSetMember,
  useRemoveSetMember,
  useSetMembers,
  useUpdateSetMemberRole,
} from '../../hooks/useSetMembers'

type MemberRole = Database['public']['Tables']['set_members']['Row']['role']

function friendlyError(error: Error | null): string | null {
  if (!error) return null
  const message = error.message.toLowerCase()
  if (message.includes('no account with that email')) return 'No QuizClone account uses that email address.'
  if (message.includes('already own this set')) return 'You already own this set.'
  return 'Could not update sharing. Please try again.'
}

export function SetSharingPanel({ setId }: { setId: string }) {
  const { data: members = [], isPending, isError } = useSetMembers(setId)
  const addMember = useAddSetMember(setId)
  const updateRole = useUpdateSetMemberRole(setId)
  const removeMember = useRemoveSetMember(setId)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('viewer')

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedEmail = email.trim()
    if (!normalizedEmail) return

    addMember.mutate(
      { email: normalizedEmail, role },
      { onSuccess: () => setEmail('') },
    )
  }

  function handleRemove(userId: string, label: string) {
    if (window.confirm(`Remove ${JSON.stringify(label)} from this set?`)) {
      removeMember.mutate(userId)
    }
  }

  const mutationError = addMember.error ?? updateRole.error ?? removeMember.error

  return (
    <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div>
        <h2 className="font-medium text-neutral-900">Sharing</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Share with an existing QuizClone account. Editors can change cards; viewers can only study them.
        </p>
      </div>

      <form onSubmit={handleAdd} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <label className="sr-only" htmlFor="member-email">Account email</label>
        <input
          id="member-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="person@example.com"
          className="min-w-0 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <label className="sr-only" htmlFor="member-role">Access level</label>
        <select
          id="member-role"
          value={role}
          onChange={(event) => setRole(event.target.value as MemberRole)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
        </select>
        <button
          type="submit"
          disabled={addMember.isPending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {addMember.isPending ? 'Sharing…' : 'Share'}
        </button>
      </form>

      {friendlyError(mutationError) && (
        <p role="alert" className="text-sm text-red-600">{friendlyError(mutationError)}</p>
      )}

      {isPending ? (
        <p className="text-sm text-neutral-500">Loading people…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">Could not load shared access.</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-neutral-500">Only you can access this set.</p>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {members.map((member) => (
            <li key={member.user_id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-800">
                  {member.profile?.display_name || member.profile?.email || 'QuizClone user'}
                </p>
                {member.profile?.display_name && member.profile.email && (
                  <p className="truncate text-xs text-neutral-500">{member.profile.email}</p>
                )}
              </div>
              <label className="sr-only" htmlFor={`role-${member.user_id}`}>Access level</label>
              <select
                id={`role-${member.user_id}`}
                value={member.role}
                disabled={updateRole.isPending || removeMember.isPending}
                onChange={(event) => updateRole.mutate({
                  userId: member.user_id,
                  role: event.target.value as MemberRole,
                })}
                className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm disabled:opacity-50"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button
                type="button"
                disabled={removeMember.isPending || updateRole.isPending}
                onClick={() => handleRemove(
                  member.user_id,
                  member.profile?.display_name || member.profile?.email || 'this person',
                )}
                className="rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
