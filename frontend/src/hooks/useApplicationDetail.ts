import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Application,
  Resume,
  ResumeTailorResponse,
  deleteApplication,
  generateCoverLetter,
  getApplication,
  listResumes,
  tailorResume,
  updateApplication,
} from '../api/client'
import { useToast } from './useToast'

export const TONES = ['professional', 'conversational', 'enthusiastic'] as const
export type Tone = (typeof TONES)[number]

export interface Edits {
  status: string
  notes: string
  tailored_resume: string
  cover_letter: string
  job_description: string
  location: string
  salary_range: string
}

const EMPTY_EDITS: Edits = {
  status: '',
  notes: '',
  tailored_resume: '',
  cover_letter: '',
  job_description: '',
  location: '',
  salary_range: '',
}

const toEdits = (app: Application): Edits => ({
  status: app.status,
  notes: app.notes ?? '',
  tailored_resume: app.tailored_resume ?? '',
  cover_letter: app.cover_letter ?? '',
  job_description: app.job_description ?? '',
  location: app.location ?? '',
  salary_range: app.salary_range ?? '',
})

export function useApplicationDetail(id: string | undefined) {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast, show: showToast } = useToast()
  const [app, setApp] = useState<Application | null>(null)
  const [edits, setEdits] = useState<Edits>(EMPTY_EDITS)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)
  const [tone, setTone] = useState<Tone>('professional')
  const [tailorResult, setTailorResult] = useState<ResumeTailorResponse | null>(null)
  const [busy, setBusy] = useState<'save' | 'delete' | 'tailor' | 'cover' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isStale: () => boolean = () => false) => {
    if (!id) return
    setError(null)
    setTailorResult(null)
    try {
      const res = await getApplication(id)
      if (isStale()) return
      setApp(res.data)
      setEdits(toEdits(res.data))
      setSelectedResumeId(res.data.resume_id ?? null)
    } catch {
      if (!isStale()) setError('Failed to load application.')
      return
    }
    listResumes()
      .then((res) => {
        if (isStale()) return
        setResumes(res.data)
        setSelectedResumeId((prev) => prev ?? res.data[0]?.id ?? null)
      })
      .catch(() => {
        if (!isStale()) setResumes([])
      })
  }, [id])

  useEffect(() => {
    let stale = false
    load(() => stale)
    return () => {
      stale = true
    }
  }, [load])

  const created = Boolean((location.state as { created?: boolean } | null)?.created)
  useEffect(() => {
    if (created) showToast('Application saved')
  }, [created, id, showToast])

  const selectedResume = resumes.find((r) => r.id === selectedResumeId) ?? null
  const patchEdits = (patch: Partial<Edits>) => setEdits((ed) => ({ ...ed, ...patch }))

  async function run(kind: NonNullable<typeof busy>, failure: string, action: () => Promise<void>) {
    setBusy(kind)
    setError(null)
    try {
      await action()
    } catch {
      setError(failure)
      showToast(failure, 'error')
    } finally {
      setBusy(null)
    }
  }

  const save = () =>
    id
      ? run('save', 'Failed to save changes.', async () => {
          const res = await updateApplication(id, {
            status: edits.status,
            notes: edits.notes,
            tailored_resume: edits.tailored_resume,
            cover_letter: edits.cover_letter,
            resume_id: selectedResumeId,
            location: edits.location || null,
            salary_range: edits.salary_range || null,
          })
          setApp(res.data)
          showToast('Changes saved')
        })
      : Promise.resolve()

  const tailor = () =>
    selectedResume && edits.job_description
      ? run('tailor', 'Failed to tailor resume.', async () => {
          setTailorResult(null)
          const res = await tailorResume(selectedResume.content, edits.job_description)
          setTailorResult(res.data)
          patchEdits({ tailored_resume: res.data.tailored_resume })
          if (id) await updateApplication(id, { tailored_resume: res.data.tailored_resume, resume_id: selectedResumeId })
          showToast('Resume tailored and saved')
        })
      : Promise.resolve()

  const writeCoverLetter = () =>
    selectedResume && edits.job_description && app
      ? run('cover', 'Failed to generate cover letter.', async () => {
          const res = await generateCoverLetter(selectedResume.content, edits.job_description, app.company, tone)
          patchEdits({ cover_letter: res.data.cover_letter })
          if (id) await updateApplication(id, { cover_letter: res.data.cover_letter, resume_id: selectedResumeId })
          showToast('Cover letter generated and saved')
        })
      : Promise.resolve()

  const remove = () =>
    id && confirm('Delete this application?')
      ? run('delete', 'Failed to delete.', async () => {
          await deleteApplication(id)
          navigate('/tracker')
        })
      : Promise.resolve()

  return {
    app, edits, patchEdits, resumes, selectedResumeId, setSelectedResumeId, tone, setTone,
    tailorResult, busy, error, toast, load: () => load(), save, tailor, writeCoverLetter, remove,
  }
}
