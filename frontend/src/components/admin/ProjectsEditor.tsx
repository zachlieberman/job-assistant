import type { PortfolioProject } from '../../api/client'
import Field from '../ui/Field'
import { PlusIcon, TrashIcon } from '../icons'
import { buttonGhost, buttonSecondary, inputClass } from '../ui/formStyles'

interface Props {
  projects: PortfolioProject[]
  onPatch: (id: number, patch: Partial<PortfolioProject>) => void
  onAdd: () => void
  onSave: (project: PortfolioProject) => void
  onDelete: (id: number) => void
}

const parseTags = (value: string) => value.split(',').map((t) => t.trim()).filter(Boolean)

export default function ProjectsEditor({ projects, onPatch, onAdd, onSave, onDelete }: Props) {
  return (
    <section aria-labelledby="projects-title" className="rounded-panel border border-line bg-surface p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="projects-title" className="text-base font-semibold text-fg">Projects</h2>
        <button type="button" onClick={onAdd} className={buttonSecondary}>
          <PlusIcon size={16} />Add project
        </button>
      </div>
      {projects.length === 0 && <p className="text-sm text-muted">No projects yet. Add one to show it on the public portfolio.</p>}
      <div className="flex flex-col gap-4">
        {projects.map((project) => (
          <div key={project.id} className="flex flex-col gap-3 rounded-control border border-line p-4">
            <Field label="Project name">
              <input className={inputClass} value={project.name} onChange={(e) => onPatch(project.id, { name: e.target.value })} />
            </Field>
            <Field label="Description">
              <textarea className={inputClass} rows={2} value={project.description} onChange={(e) => onPatch(project.id, { description: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tags" hint="Separate with commas">
                <input className={inputClass} value={project.tags.join(', ')} onChange={(e) => onPatch(project.id, { tags: parseTags(e.target.value) })} />
              </Field>
              <Field label="Link (optional)">
                <input className={inputClass} value={project.link ?? ''} onChange={(e) => onPatch(project.id, { link: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => onDelete(project.id)} className={buttonGhost}>
                <TrashIcon size={16} />Delete
              </button>
              <button type="button" onClick={() => onSave(project)} className={buttonSecondary}>Save</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
