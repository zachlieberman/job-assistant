import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  getApplication,
  updateApplication,
  deleteApplication,
  tailorResume,
  generateCoverLetter,
  listResumes,
  Application,
  Resume,
  ResumeTailorResponse,
} from '../api/client'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'

const STATUSES = ['applied', 'phone_screen', 'technical', 'offer', 'rejected']

const STATUS_COLORS: Record<string, string> = {
  applied: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30',
  phone_screen: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  technical: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',
  offer: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
}
const TONES = ['professional', 'conversational', 'enthusiastic'] as const
type Tone = typeof TONES[number]

const LABEL = 'text-xs font-semibold text-gray-500 uppercase tracking-wider'

interface SectionProps {
  label: string
  value: string
  onChange?: (v: string) => void
  defaultRows?: number
  actions?: React.ReactNode
  mono?: boolean
}

function Section({ label, value, onChange, defaultRows = 6, actions, mono = false }: SectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [editing, setEditing] = useState(false)
  const readOnly = !onChange

  return (
    <div className="flex flex-col gap-2 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 text-left group"
        >
          <span className={`text-gray-600 transition-transform text-xs ${collapsed ? '-rotate-90' : ''}`}>▼</span>
          <span className={LABEL}>{label}</span>
        </button>
        <div className="flex items-center gap-2">
          {actions}
          {!readOnly && (
            <button
              onClick={() => setEditing((e) => !e)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-0.5 rounded border border-indigo-500/30 hover:border-indigo-400/50"
            >
              {editing ? 'Done' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        editing ? (
          <textarea
            value={value}
            onChange={(e) => onChange!(e.target.value)}
            rows={defaultRows}
            className={`w-full bg-gray-950 border-0 p-4 text-sm text-gray-200 resize-y focus:outline-none leading-relaxed ${mono ? 'font-mono' : ''}`}
          />
        ) : (
          <div
            className={`p-4 text-sm text-gray-400 leading-relaxed whitespace-pre-wrap overflow-y-auto resize-y ${mono ? 'font-mono' : ''}`}
            style={{ minHeight: `${defaultRows * 1.5}rem` }}
          >
            {value || <span className="italic text-gray-600">Empty</span>}
          </div>
        )
      )}
    </div>
  )
}

interface Edits {
  status: string
  notes: string
  tailored_resume: string
  cover_letter: string
  job_description: string
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [app, setApp] = useState<Application | null>(null)
  const [edits, setEdits] = useState<Edits>({
    status: '',
    notes: '',
    tailored_resume: '',
    cover_letter: '',
    job_description: '',
  })
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)
  const [tone, setTone] = useState<Tone>('professional')
  const [tailorResult, setTailorResult] = useState<ResumeTailorResponse | null>(null)

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [tailoring, setTailoring] = useState(false)
  const [generatingCover, setGeneratingCover] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast, show: showToast } = useToast()

  useEffect(() => {
    if (!id) return
    getApplication(id).then((res) => {
      setApp(res.data)
      setEdits({
        status: res.data.status,
        notes: res.data.notes ?? '',
        tailored_resume: res.data.tailored_resume ?? '',
        cover_letter: res.data.cover_letter ?? '',
        job_description: res.data.job_description ?? '',
      })
      if (res.data.resume_id) setSelectedResumeId(res.data.resume_id)
    }).catch(() => setError('Failed to load application.'))

    listResumes().then((res) => {
      setResumes(res.data)
      setSelectedResumeId((prev) => prev ?? (res.data[0]?.id ?? null))
    })

    if ((location.state as { created?: boolean })?.created) {
      showToast('Application saved')
    }
  }, [id])

  const selectedResume = resumes.find((r) => r.id === selectedResumeId) ?? null

  async function handleSave() {
    if (!id) return
    setSaving(true)
    try {
      const res = await updateApplication(id, {
        status: edits.status,
        notes: edits.notes,
        tailored_resume: edits.tailored_resume,
        cover_letter: edits.cover_letter,
        resume_id: selectedResumeId,
      })
      setApp(res.data)
      showToast('Changes saved')
    } catch {
      setError('Failed to save changes.')
      showToast('Failed to save changes', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleTailor() {
    if (!selectedResume || !edits.job_description) return
    setTailoring(true)
    setError(null)
    setTailorResult(null)
    try {
      const res = await tailorResume(selectedResume.content, edits.job_description)
      setTailorResult(res.data)
      setEdits((ed) => ({ ...ed, tailored_resume: res.data.tailored_resume }))
      if (id) {
        await updateApplication(id, {
          tailored_resume: res.data.tailored_resume,
          resume_id: selectedResumeId,
        })
      }
      showToast('Resume tailored and saved')
    } catch {
      setError('Failed to tailor resume.')
      showToast('Failed to tailor resume', 'error')
    } finally {
      setTailoring(false)
    }
  }

  async function handleGenerateCoverLetter() {
    if (!selectedResume || !edits.job_description || !app) return
    setGeneratingCover(true)
    setError(null)
    try {
      const res = await generateCoverLetter(
        selectedResume.content,
        edits.job_description,
        app.company,
        tone,
      )
      setEdits((ed) => ({ ...ed, cover_letter: res.data.cover_letter }))
      if (id) {
        await updateApplication(id, {
          cover_letter: res.data.cover_letter,
          resume_id: selectedResumeId,
        })
      }
      showToast('Cover letter generated and saved')
    } catch {
      setError('Failed to generate cover letter.')
      showToast('Failed to generate cover letter', 'error')
    } finally {
      setGeneratingCover(false)
    }
  }

  async function handleDelete() {
    if (!id || !confirm('Delete this application?')) return
    setDeleting(true)
    try {
      await deleteApplication(id)
      navigate('/')
    } catch {
      setError('Failed to delete.')
      setDeleting(false)
    }
  }

  if (error && !app) return <p className="text-red-400">{error}</p>
  if (!app) return <p className="text-gray-500">Loading...</p>

  const hasResumes = resumes.length > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white">{app.company}</h1>
          <p className="text-gray-400">{app.role}</p>
          {app.job_url && (
            <a href={app.job_url} target="_blank" rel="noreferrer" className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors mt-0.5">
              {app.job_url} ↗
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/interview/${id}`)}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-3.5 py-2 rounded-lg font-medium transition-colors"
          >
            Interview Prep
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 disabled:opacity-50 px-3.5 py-2 rounded-lg font-medium transition-colors"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
        <span className={LABEL}>Status</span>
        <select
          value={edits.status}
          onChange={(e) => setEdits((ed) => ({ ...ed, status: e.target.value }))}
          className={`appearance-none cursor-pointer px-2.5 py-0.5 rounded-full text-xs font-medium focus:outline-none transition-colors ${STATUS_COLORS[edits.status] ?? 'bg-gray-800 text-gray-400 ring-1 ring-gray-700'}`}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
        </select>
      </div>

      {/* AI Actions panel */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">AI Actions</h2>

        {!hasResumes ? (
          <p className="text-sm text-gray-500">
            No resumes found.{' '}
            <a href="/profile" className="text-indigo-400 hover:text-indigo-300 underline">
              Add a resume in your profile
            </a>{' '}
            to tailor and generate cover letters.
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Resume</label>
              <select
                value={selectedResumeId ?? ''}
                onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Cover Letter Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pb-0.5">
              <button
                onClick={handleTailor}
                disabled={tailoring || !selectedResumeId}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {tailoring ? 'Tailoring...' : 'Tailor Resume'}
              </button>
              <button
                onClick={handleGenerateCoverLetter}
                disabled={generatingCover || !selectedResumeId}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {generatingCover ? 'Generating...' : 'Generate Cover Letter'}
              </button>
            </div>
          </div>
        )}

        {tailorResult && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-800">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2.5">Keyword Matches</p>
              <div className="flex flex-wrap gap-1.5">
                {tailorResult.keyword_matches.map((k) => (
                  <span key={k} className="bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full">{k}</span>
                ))}
              </div>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2.5">Missing Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {tailorResult.missing_keywords.map((k) => (
                  <span key={k} className="bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30 text-xs px-2.5 py-0.5 rounded-full">{k}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Section
        label="Job Description"
        value={edits.job_description}
        onChange={(v) => setEdits((ed) => ({ ...ed, job_description: v }))}
        defaultRows={10}
      />

      <Section
        label="Tailored Resume"
        value={edits.tailored_resume}
        onChange={(v) => setEdits((ed) => ({ ...ed, tailored_resume: v }))}
        defaultRows={20}
        mono
      />

      <Section
        label="Cover Letter"
        value={edits.cover_letter}
        onChange={(v) => setEdits((ed) => ({ ...ed, cover_letter: v }))}
        defaultRows={10}
      />

      <Section
        label="Notes"
        value={edits.notes}
        onChange={(v) => setEdits((ed) => ({ ...ed, notes: v }))}
        defaultRows={4}
      />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex justify-end border-t border-gray-800 pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  )
}
