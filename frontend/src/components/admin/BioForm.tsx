import type { FormEvent } from 'react'
import type { PortfolioBio } from '../../api/client'
import Field from '../ui/Field'
import { buttonPrimary, inputClass } from '../ui/formStyles'

interface Props {
  bio: PortfolioBio
  onChange: (bio: PortfolioBio) => void
  onSubmit: (e: FormEvent) => void
}

export default function BioForm({ bio, onChange, onSubmit }: Props) {
  const set = (patch: Partial<PortfolioBio>) => onChange({ ...bio, ...patch })
  return (
    <section aria-labelledby="bio-title" className="rounded-panel border border-line bg-surface p-4 md:p-5">
      <h2 id="bio-title" className="mb-4 text-base font-semibold text-fg">Bio</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input className={inputClass} value={bio.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Title">
            <input className={inputClass} value={bio.title} onChange={(e) => set({ title: e.target.value })} />
          </Field>
        </div>
        <Field label="Location">
          <input className={inputClass} value={bio.location ?? ''} onChange={(e) => set({ location: e.target.value })} />
        </Field>
        <Field label="Bio">
          <textarea className={inputClass} rows={4} value={bio.bio} onChange={(e) => set({ bio: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Email">
            <input className={inputClass} value={bio.email ?? ''} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="GitHub URL">
            <input className={inputClass} value={bio.github_url ?? ''} onChange={(e) => set({ github_url: e.target.value })} />
          </Field>
          <Field label="LinkedIn URL">
            <input className={inputClass} value={bio.linkedin_url ?? ''} onChange={(e) => set({ linkedin_url: e.target.value })} />
          </Field>
        </div>
        <button type="submit" className={`${buttonPrimary} self-start`}>Save bio</button>
      </form>
    </section>
  )
}
