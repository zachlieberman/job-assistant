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
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'

const inputClass =
  'bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors'
const labelClass = 'text-xs font-semibold text-gray-500 uppercase tracking-wider'

interface ResumeFormState {
  name: string
  content: string
}

export default function Profile() {
  const [linkedin, setLinkedin] = useState('')
  const [github, setGithub] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

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
    setProfileSaved(false)
    try {
      await updateProfile({
        linkedin_url: linkedin || null,
        github_url: github || null,
      })
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
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
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Your information used across all applications.</p>
      </div>

      {/* Profile info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Links</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>LinkedIn URL</label>
            <input
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/yourname"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>GitHub URL</label>
            <input
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/yourname"
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveProfile}
            disabled={profileSaving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {profileSaving ? 'Saving...' : 'Save Profile'}
          </button>
          {profileSaved && <span className="text-emerald-400 text-sm">Saved!</span>}
        </div>
      </div>

      {/* Resumes */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Resumes</h2>
          {!addingNew && (
            <button
              onClick={() => { setAddingNew(true); setEditingId(null) }}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              + Add Resume
            </button>
          )}
        </div>

        {addingNew && (
          <div className="bg-gray-900 border border-indigo-500/40 rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white">New Resume</h3>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Name</label>
              <input
                value={newForm.name}
                onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Software Engineer Resume"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Content</label>
              <textarea
                value={newForm.content}
                onChange={(e) => setNewForm((f) => ({ ...f, content: e.target.value }))}
                rows={12}
                placeholder="Paste your resume text here..."
                className={`${inputClass} resize-y font-mono`}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddResume}
                disabled={resumeSaving || !newForm.name || !newForm.content}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {resumeSaving ? 'Saving...' : 'Save Resume'}
              </button>
              <button
                onClick={() => { setAddingNew(false); setNewForm({ name: '', content: '' }) }}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {resumes.length === 0 && !addingNew && (
          <div className="border border-dashed border-gray-800 rounded-xl py-10 text-center">
            <p className="text-gray-500 text-sm">No resumes yet.</p>
            <p className="text-gray-600 text-xs mt-1">Add a resume to use it when tailoring applications.</p>
          </div>
        )}

        {resumes.map((resume) => (
          <div key={resume.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {editingId === resume.id ? (
              <div className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Name</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Content</label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                    rows={12}
                    className={`${inputClass} resize-y font-mono`}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleUpdateResume}
                    disabled={resumeSaving}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {resumeSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-white">{resume.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {resume.content.slice(0, 80).trim()}…
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => startEdit(resume)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded border border-indigo-500/30 hover:border-indigo-400/50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteResume(resume.id)}
                    className="text-xs text-red-400 hover:text-red-300 px-2.5 py-1 rounded border border-red-500/20 hover:border-red-400/40 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  )
}
