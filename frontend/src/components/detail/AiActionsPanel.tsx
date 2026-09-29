import { Link } from 'react-router-dom'
import type { Resume, ResumeTailorResponse } from '../../api/client'
import { TONES, type Tone } from '../../hooks/useApplicationDetail'
import { SparkIcon } from '../icons'
import Field from '../ui/Field'
import { buttonPrimary, inputClass } from '../ui/formStyles'

interface Props {
  resumes: Resume[]
  selectedResumeId: number | null
  onSelectResume: (id: number) => void
  tone: Tone
  onTone: (tone: Tone) => void
  tailoring: boolean
  writing: boolean
  onTailor: () => void
  onWriteCoverLetter: () => void
  result: ResumeTailorResponse | null
}

function KeywordList({ title, words }: { title: string; words: string[] }) {
  return (
    <div className="rounded-control border border-line p-4">
      <p className="mb-2.5 text-sm font-medium text-fg">{title}</p>
      {words.length === 0 ? (
        <p className="text-sm text-muted">None.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {words.map((k) => (
            <li key={k} className="rounded-row bg-raised px-2 py-0.5 text-xs text-fg">{k}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function AiActionsPanel(p: Props) {
  return (
    <section aria-labelledby="ai-title" className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-4 md:p-5">
      <h2 id="ai-title" className="flex items-center gap-2 text-base font-semibold text-fg">
        <SparkIcon size={18} className="text-brand-text" />
        AI actions
      </h2>
      {p.resumes.length === 0 ? (
        <p className="text-sm text-muted">
          No resumes yet.{' '}
          <Link to="/tracker/profile" className="text-brand-text underline">Add a resume in your profile</Link>{' '}
          to tailor it and generate cover letters.
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Resume">
            <select className={`${inputClass} !w-auto`} value={p.selectedResumeId ?? ''} onChange={(e) => p.onSelectResume(Number(e.target.value))}>
              {p.resumes.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Cover letter tone">
            <select className={`${inputClass} !w-auto`} value={p.tone} onChange={(e) => p.onTone(e.target.value as Tone)}>
              {TONES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </Field>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={p.onTailor} disabled={p.tailoring || !p.selectedResumeId} className={buttonPrimary}>
              {p.tailoring ? 'Tailoring…' : 'Tailor resume'}
            </button>
            <button type="button" onClick={p.onWriteCoverLetter} disabled={p.writing || !p.selectedResumeId} className={buttonPrimary}>
              {p.writing ? 'Generating…' : 'Generate cover letter'}
            </button>
          </div>
        </div>
      )}
      {p.result && (
        <div className="grid gap-4 border-t border-line pt-4 md:grid-cols-2">
          <KeywordList title="Keywords you match" words={p.result.keyword_matches} />
          <KeywordList title="Keywords to add" words={p.result.missing_keywords} />
        </div>
      )}
    </section>
  )
}
