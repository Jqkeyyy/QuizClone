import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import type { Database } from '../types/database'
import { useAuth } from '../hooks/useAuth'
import { useProfile, useUpdateDisplayName } from '../hooks/useProfile'
import { deleteAccount } from '../lib/db/profiles'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

function ProfileForm({ profile }: { profile: ProfileRow }) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const updateProfile = useUpdateDisplayName(profile.id)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedName = displayName.trim() || null
    updateProfile.mutate(normalizedName, {
      onSuccess: () => setDisplayName(normalizedName ?? ''),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6">
      <label className="block space-y-1">
        <span className="text-sm font-medium text-neutral-700">Display name</span>
        <input
          type="text"
          value={displayName}
          maxLength={80}
          autoComplete="name"
          onChange={(event) => {
            setDisplayName(event.target.value)
            updateProfile.reset()
          }}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <span className="block text-xs text-neutral-500">Shown to people who share sets with you.</span>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-neutral-700">Email</span>
        <input
          type="email"
          value={profile.email}
          readOnly
          aria-readonly="true"
          className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
        />
        <span className="block text-xs text-neutral-500">Email changes are managed through Supabase Authentication.</span>
      </label>

      {updateProfile.isError && <p role="alert" className="text-sm text-red-600">Could not save your profile. Please try again.</p>}
      {updateProfile.isSuccess && <p role="status" className="text-sm text-emerald-700">Profile saved.</p>}
      <button
        type="submit"
        disabled={updateProfile.isPending || (displayName.trim() || null) === profile.display_name}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {updateProfile.isPending ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}

function DeleteAccountPanel() {
  const [confirmation, setConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsDeleting(true)
    setFailed(false)
    try {
      await deleteAccount()
    } catch {
      setFailed(true)
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-red-200 bg-white p-6">
      <div className="space-y-1">
        <h2 className="text-sm font-medium text-red-700">Delete account</h2>
        <p className="text-xs text-neutral-500">
          Permanently deletes your account, your sets and their images, and your study history. Sets you shared are
          removed for everyone they were shared with. This can't be undone.
        </p>
      </div>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-neutral-700">Type DELETE to confirm</span>
        <input
          type="text"
          value={confirmation}
          autoComplete="off"
          onChange={(event) => setConfirmation(event.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
      </label>
      {failed && <p role="alert" className="text-sm text-red-600">Could not delete your account. Please try again.</p>}
      <button
        type="submit"
        disabled={isDeleting || confirmation !== 'DELETE'}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isDeleting ? 'Deleting…' : 'Delete my account'}
      </button>
    </form>
  )
}

export default function Settings() {
  const { user } = useAuth()
  const { data: profile, isPending, isError } = useProfile(user?.id)

  if (isPending) return <p role="status" className="text-sm text-neutral-500">Loading profile…</p>
  if (isError || !profile) return <p className="text-sm text-red-600">Could not load your profile.</p>

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-700">← My sets</Link>
        <h1 className="mt-3 text-xl font-semibold text-neutral-900">Account</h1>
      </div>
      <ProfileForm key={profile.id} profile={profile} />
      <DeleteAccountPanel />
    </div>
  )
}
