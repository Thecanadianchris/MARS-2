/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * AddPersonPanel
 *
 * Purpose:
 * v0.16.8. Lets the owner add a new named local profile directly
 * from the Identity tab ("how can we add more users") instead of
 * being limited to the three seeded profiles (Christian/Ann/
 * Finley). A newly added person immediately gets an Enroll row in
 * FaceEnrollmentPanel.jsx below — that component already renders
 * over whatever PersonRegistry knows about, so adding a profile
 * here is the only step needed before enrolling their face.
 *
 * Version:
 * v0.16.8
 *
 * Date Code:
 * 160726
 * ==========================================================
 */

import { useState } from 'react'
import { Trash2, UserPlus } from 'lucide-react'
import { IDENTITY_USER_TYPES } from '@/services/identity/IdentityTypes'

const USER_TYPE_OPTIONS = [
  { value: IDENTITY_USER_TYPES.TRUSTED_USER, label: 'Trusted User' },
  { value: IDENTITY_USER_TYPES.PROTECTED_USER, label: 'Protected User' },
  { value: IDENTITY_USER_TYPES.GUEST, label: 'Guest' },
]

export default function AddPersonPanel({ profiles = [], addPerson, removePerson }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [userType, setUserType] = useState(IDENTITY_USER_TYPES.TRUSTED_USER)
  const [feedback, setFeedback] = useState(null)

  const customProfiles = profiles.filter((profile) => profile.source === 'owner_added')

  const handleAdd = () => {
    const result = addPerson({ displayName: name, userType })

    if (result.status === 'success') {
      setFeedback({
        status: 'success',
        message: `${result.profile.displayName} added — scroll down to enroll their face.`,
      })
      setName('')
      setUserType(IDENTITY_USER_TYPES.TRUSTED_USER)
      setOpen(false)
    } else {
      setFeedback({ status: 'error', message: 'Enter a name first.' })
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserPlus size={16} className="text-cyan-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Add Person
          </h2>
        </div>

        <button
          onClick={() => {
            setFeedback(null)
            setOpen((value) => !value)
          }}
          className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20"
        >
          {open ? 'Cancel' : '+ Add'}
        </button>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-slate-400">
        Not limited to Christian, Ann and Finley — add anyone else MARS should know, then enroll
        their face below. Stored on this device only.
      </p>

      {open && (
        <div className="space-y-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none"
          />

          <div className="grid grid-cols-3 gap-2">
            {USER_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setUserType(option.value)}
                className={`rounded-xl border px-2 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  userType === option.value
                    ? 'border-cyan-500/30 bg-cyan-500/20 text-cyan-200'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-cyan-500/20 hover:text-cyan-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleAdd}
            className="w-full rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20"
          >
            Add Person
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`mt-3 rounded-xl border p-3 text-xs ${
            feedback.status === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/20 bg-red-500/10 text-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {customProfiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-xs uppercase tracking-wider text-slate-500">Added people</div>

          {customProfiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div>
                <div className="font-semibold text-white">{profile.displayName}</div>
                <div className="text-xs capitalize text-slate-500">
                  {profile.userType.replace('_', ' ')}
                </div>
              </div>

              <button
                onClick={() => removePerson(profile.id)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 hover:border-red-500/30 hover:text-red-300"
                aria-label={`Remove ${profile.displayName}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
