import { useEffect, useState } from 'react'
import {
  PortfolioBio,
  PortfolioExperience,
  PortfolioProject,
  clearAuthToken,
  createPortfolioExperience,
  createPortfolioProject,
  deletePortfolioExperience,
  deletePortfolioProject,
  getPortfolioBio,
  listPortfolioExperience,
  listPortfolioProjects,
  updatePortfolioBio,
  updatePortfolioExperience,
  updatePortfolioProject,
} from '../api/client'

const inputClass =
  'w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500'

export default function Admin() {
  const [bio, setBio] = useState<PortfolioBio | null>(null)
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [experience, setExperience] = useState<PortfolioExperience[]>([])
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    getPortfolioBio().then((res) => setBio(res.data))
    listPortfolioProjects().then((res) => setProjects(res.data))
    listPortfolioExperience().then((res) => setExperience(res.data))
  }, [])

  function flashSaved() {
    setSavedMessage('Saved')
    setTimeout(() => setSavedMessage(''), 1500)
  }

  async function handleSaveBio(e: React.FormEvent) {
    e.preventDefault()
    if (!bio) return
    const res = await updatePortfolioBio({
      name: bio.name,
      title: bio.title,
      location: bio.location,
      bio: bio.bio,
      email: bio.email,
      github_url: bio.github_url,
      linkedin_url: bio.linkedin_url,
    })
    setBio(res.data)
    flashSaved()
  }

  async function handleAddProject() {
    const res = await createPortfolioProject({
      name: 'New Project',
      description: '',
      tags: [],
      sort_order: projects.length,
    })
    setProjects((prev) => [...prev, res.data])
  }

  async function handleSaveProject(project: PortfolioProject) {
    const res = await updatePortfolioProject(project.id, {
      name: project.name,
      description: project.description,
      tags: project.tags,
      link: project.link,
      sort_order: project.sort_order,
    })
    setProjects((prev) => prev.map((p) => (p.id === project.id ? res.data : p)))
    flashSaved()
  }

  async function handleDeleteProject(id: number) {
    if (!confirm('Delete this project?')) return
    await deletePortfolioProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  async function handleAddExperience() {
    const res = await createPortfolioExperience({
      role: 'New Role',
      company: '',
      period: '',
      bullets: [],
      sort_order: experience.length,
    })
    setExperience((prev) => [...prev, res.data])
  }

  async function handleSaveExperience(entry: PortfolioExperience) {
    const res = await updatePortfolioExperience(entry.id, {
      role: entry.role,
      company: entry.company,
      period: entry.period,
      bullets: entry.bullets,
      sort_order: entry.sort_order,
    })
    setExperience((prev) => prev.map((e) => (e.id === entry.id ? res.data : e)))
    flashSaved()
  }

  async function handleDeleteExperience(id: number) {
    if (!confirm('Delete this experience entry?')) return
    await deletePortfolioExperience(id)
    setExperience((prev) => prev.filter((e) => e.id !== id))
  }

  function handleLogout() {
    clearAuthToken()
    window.location.href = '/login'
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Edit Portfolio</h1>
        <div className="flex items-center gap-3">
          {savedMessage && <span className="text-sm text-green-400">{savedMessage}</span>}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Bio section */}
      {bio && (
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Bio
          </h2>
          <form onSubmit={handleSaveBio} className="flex flex-col gap-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input
                  className={inputClass}
                  value={bio.name}
                  onChange={(e) => setBio({ ...bio, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input
                  className={inputClass}
                  value={bio.title}
                  onChange={(e) => setBio({ ...bio, title: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Location</label>
              <input
                className={inputClass}
                value={bio.location ?? ''}
                onChange={(e) => setBio({ ...bio, location: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bio</label>
              <textarea
                className={inputClass}
                rows={4}
                value={bio.bio}
                onChange={(e) => setBio({ ...bio, bio: e.target.value })}
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input
                  className={inputClass}
                  value={bio.email ?? ''}
                  onChange={(e) => setBio({ ...bio, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">GitHub URL</label>
                <input
                  className={inputClass}
                  value={bio.github_url ?? ''}
                  onChange={(e) => setBio({ ...bio, github_url: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">LinkedIn URL</label>
                <input
                  className={inputClass}
                  value={bio.linkedin_url ?? ''}
                  onChange={(e) => setBio({ ...bio, linkedin_url: e.target.value })}
                />
              </div>
            </div>
            <button
              type="submit"
              className="self-start bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Save Bio
            </button>
          </form>
        </section>
      )}

      {/* Projects section */}
      <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Projects
          </h2>
          <button
            onClick={handleAddProject}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            + Add Project
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {projects.map((project) => (
            <div key={project.id} className="border border-gray-800 rounded-lg p-4 flex flex-col gap-2">
              <input
                className={inputClass}
                value={project.name}
                placeholder="Project name"
                onChange={(e) =>
                  setProjects((prev) =>
                    prev.map((p) => (p.id === project.id ? { ...p, name: e.target.value } : p)),
                  )
                }
              />
              <textarea
                className={inputClass}
                rows={2}
                value={project.description}
                placeholder="Description"
                onChange={(e) =>
                  setProjects((prev) =>
                    prev.map((p) =>
                      p.id === project.id ? { ...p, description: e.target.value } : p,
                    ),
                  )
                }
              />
              <input
                className={inputClass}
                value={project.tags.join(', ')}
                placeholder="Tags, comma separated"
                onChange={(e) =>
                  setProjects((prev) =>
                    prev.map((p) =>
                      p.id === project.id
                        ? {
                            ...p,
                            tags: e.target.value
                              .split(',')
                              .map((t) => t.trim())
                              .filter(Boolean),
                          }
                        : p,
                    ),
                  )
                }
              />
              <input
                className={inputClass}
                value={project.link ?? ''}
                placeholder="Link (optional)"
                onChange={(e) =>
                  setProjects((prev) =>
                    prev.map((p) => (p.id === project.id ? { ...p, link: e.target.value } : p)),
                  )
                }
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleSaveProject(project)}
                  className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Experience section */}
      <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Experience
          </h2>
          <button
            onClick={handleAddExperience}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            + Add Job
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {experience.map((entry) => (
            <div key={entry.id} className="border border-gray-800 rounded-lg p-4 flex flex-col gap-2">
              <div className="grid sm:grid-cols-2 gap-2">
                <input
                  className={inputClass}
                  value={entry.role}
                  placeholder="Role"
                  onChange={(e) =>
                    setExperience((prev) =>
                      prev.map((x) => (x.id === entry.id ? { ...x, role: e.target.value } : x)),
                    )
                  }
                />
                <input
                  className={inputClass}
                  value={entry.company}
                  placeholder="Company"
                  onChange={(e) =>
                    setExperience((prev) =>
                      prev.map((x) => (x.id === entry.id ? { ...x, company: e.target.value } : x)),
                    )
                  }
                />
              </div>
              <input
                className={inputClass}
                value={entry.period}
                placeholder="Period (e.g. Jan 2024 – Present)"
                onChange={(e) =>
                  setExperience((prev) =>
                    prev.map((x) => (x.id === entry.id ? { ...x, period: e.target.value } : x)),
                  )
                }
              />
              <textarea
                className={inputClass}
                rows={4}
                value={entry.bullets.join('\n')}
                placeholder="One bullet point per line"
                onChange={(e) =>
                  setExperience((prev) =>
                    prev.map((x) =>
                      x.id === entry.id
                        ? { ...x, bullets: e.target.value.split('\n').filter(Boolean) }
                        : x,
                    ),
                  )
                }
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => handleDeleteExperience(entry.id)}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleSaveExperience(entry)}
                  className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
