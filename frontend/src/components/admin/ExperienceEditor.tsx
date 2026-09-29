import type { PortfolioExperience } from '../../api/client'
import Field from '../ui/Field'
import { PlusIcon, TrashIcon } from '../icons'
import { buttonGhost, buttonSecondary, inputClass } from '../ui/formStyles'

interface Props {
  entries: PortfolioExperience[]
  onPatch: (id: number, patch: Partial<PortfolioExperience>) => void
  onAdd: () => void
  onSave: (entry: PortfolioExperience) => void
  onDelete: (id: number) => void
}

export default function ExperienceEditor({ entries, onPatch, onAdd, onSave, onDelete }: Props) {
  return (
    <section aria-labelledby="experience-title" className="rounded-panel border border-line bg-surface p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="experience-title" className="text-base font-semibold text-fg">Experience</h2>
        <button type="button" onClick={onAdd} className={buttonSecondary}>
          <PlusIcon size={16} />Add job
        </button>
      </div>
      {entries.length === 0 && <p className="text-sm text-muted">No experience yet. Add a job to show it on the public portfolio.</p>}
      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          <div key={entry.id} className="flex flex-col gap-3 rounded-control border border-line p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Role">
                <input className={inputClass} value={entry.role} onChange={(e) => onPatch(entry.id, { role: e.target.value })} />
              </Field>
              <Field label="Company">
                <input className={inputClass} value={entry.company} onChange={(e) => onPatch(entry.id, { company: e.target.value })} />
              </Field>
            </div>
            <Field label="Period" hint="For example, Jan 2024 – Present">
              <input className={inputClass} value={entry.period} onChange={(e) => onPatch(entry.id, { period: e.target.value })} />
            </Field>
            <Field label="Highlights" hint="One bullet point per line">
              <textarea className={inputClass} rows={4} value={entry.bullets.join('\n')} onChange={(e) => onPatch(entry.id, { bullets: e.target.value.split('\n').filter(Boolean) })} />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => onDelete(entry.id)} className={buttonGhost}>
                <TrashIcon size={16} />Delete
              </button>
              <button type="button" onClick={() => onSave(entry)} className={buttonSecondary}>Save</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
