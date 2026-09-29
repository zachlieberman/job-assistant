import { useState, useEffect } from 'react'
import {
  getProfile,
  updateProfile,
  listResumes,
  createResume,
  updateResume,
  deleteResume,
  Resume,
} from '../api/client'
import ResumeForm, { ResumeFormState } from '../components/profile/ResumeForm'
import Field from '../components/ui/Field'
import PageHeader from '../components/ui/PageHeader'
import ErrorPanel from '../components/ui/ErrorPanel'
import { PlusIcon, TrashIcon } from '../components/icons'
import { buttonGhost, buttonPrimary, buttonSecondary, inputClass } from '../components/ui/formStyles'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'


export default function Profile() {
  const [linkedin, setLinkedin] = useState('')
  const [github, setGithub] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  const [resumes, setResumes] = useState<Resume[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<ResumeFormState>({ name: '', content: '' })
  const [addingNew, setAddingNew] = useState(false)
  const [newForm, setNewForm] = useState<ResumeFormState>({ name: '', content: '' })
  const [resumeSaving, setResumeSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast, show: showToast } = useToast()

  useEffect(() => {
    getProfile().then((res) => {
      setLinkedin(res.data.linkedin_url ?? '')
      setGithub(res.data.github_url ?? '')
    })
    listResumes().then((res) => setResumes(res.data))
  }, [])

  async function handleSaveProfile() {
    setProfileSaving(true)
    try {
      await updateProfile({
        linkedin_url: linkedin || null,
        github_url: github || null,
      })
      showToast('Profile saved')
    } catch {
      setError('Failed to save profile.')
      showToast('Failed to save profile', 'error')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleAddResume() {
    if (!newForm.name || !newForm.content) return
    setResumeSaving(true)
    try {
      const res = await createResume(newForm)
      setResumes((prev) => [res.data, ...prev])
      setNewForm({ name: '', content: '' })
      setAddingNew(false)
      showToast('Resume added')
    } catch {
      setError('Failed to save resume.')
      showToast('Failed to save resume', 'error')
    } finally {
      setResumeSaving(false)
    }
  }

  async function handleUpdateResume() {
    if (editingId === null) return
    setResumeSaving(true)
    try {
      const res = await updateResume(editingId, editForm)
      setResumes((prev) => prev.map((r) => (r.id === editingId ? res.data : r)))
      setEditingId(null)
      showToast('Resume updated')
    } catch {
      setError('Failed to update resume.')
      showToast('Failed to update resume', 'error')
    } finally {
      setResumeSaving(false)
    }
  }

  async function handleDeleteResume(id: number) {
    if (!confirm('Delete this resume?')) return
    try {
      await deleteResume(id)
      setResumes((prev) => prev.filter((r) => r.id !== id))
    } catch {
      setError('Failed to delete resume.')
    }
  }

  function startEdit(resume: Resume) {
    setEditingId(resume.id)
    setEditForm({ name: resume.name, content: resume.content })
    setAddingNew(false)
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <PageHeader description="Your links and resumes, used across all applications." />

      <section aria-labelledby="links-title" className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-4 md:p-6">
        <h2 id="links-title" className="text-base font-semibold text-fg">Links</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="LinkedIn URL">
            <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/yourname" inputMode="url" className={inputClass} />
          </Field>
          <Field label="GitHub URL">
            <input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/yourname" inputMode="url" className={inputClass} />
          </Field>
        </div>
        <button type="button" onClick={handleSaveProfile} disabled={profileSaving} className={`${buttonPrimary} w-fit`}>
          {profileSaving ? 'Saving…' : 'Save profile'}
        </button>
      </section>

      <section aria-labelledby="resumes-title" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="resumes-title" className="text-base font-semibold text-fg">Resumes</h2>
          {!addingNew && (
            <button type="button" onClick={() => { setAddingNew(true); setEditingId(null) }} className={buttonSecondary}>
              <PlusIcon size={16} />Add resume
            </button>
          )}
        </div>

        {addingNew && (
          <div className="rounded-panel border border-brand-text/50 bg-surface p-4 md:p-5">
            <ResumeForm
              title="New resume"
              value={newForm}
              onChange={setNewForm}
              onSave={handleAddResume}
              onCancel={() => { setAddingNew(false); setNewForm({ name: '', content: '' }) }}
              saving={resumeSaving}
              saveLabel="Save resume"
              canSave={Boolean(newForm.name && newForm.content)}
              namePlaceholder="e.g. Software Engineer resume"
            />
          </div>
        )}

        {resumes.length === 0 && !addingNew && (
          <div className="rounded-panel border border-dashed border-field px-4 py-10 text-center">
            <p className="font-medium text-fg">No resumes yet.</p>
            <p className="mt-1 text-sm text-muted">Add a resume so you can tailor it to each job.</p>
          </div>
        )}

        {resumes.map((resume) => (
          <div key={resume.id} className="overflow-hidden rounded-panel border border-line bg-surface">
            {editingId === resume.id ? (
              <div className="p-4 md:p-5">
                <ResumeForm value={editForm} onChange={setEditForm} onSave={handleUpdateResume} onCancel={() => setEditingId(null)} saving={resumeSaving} saveLabel="Save" />
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5">
                <div className="min-w-0">
                  <p className="font-medium text-fg">{resume.name}</p>
                  <p className="truncate text-sm text-muted">{resume.content.slice(0, 80).trim()}…</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => startEdit(resume)} className={buttonSecondary}>Edit</button>
                  <button type="button" onClick={() => handleDeleteResume(resume.id)} className={buttonGhost}>
                    <TrashIcon size={16} />Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      {error && <ErrorPanel title={error} detail="Your changes weren't saved. Check your connection and try again." />}
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  )
}
