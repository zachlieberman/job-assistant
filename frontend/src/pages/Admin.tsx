import { useCallback, useEffect, useState } from 'react'
import BioForm from '../components/admin/BioForm'
import ExperienceEditor from '../components/admin/ExperienceEditor'
import ProjectsEditor from '../components/admin/ProjectsEditor'
import Toast from '../components/Toast'
import ErrorPanel from '../components/ui/ErrorPanel'
import { LoadingRegion, Skeleton } from '../components/ui/Skeleton'
import { AlertIcon } from '../components/icons'
import { useToast } from '../hooks/useToast'
import { patchItem } from '../lib/patchItem'
import {
  PortfolioBio,
  PortfolioExperience,
  PortfolioProject,
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

const ERROR_MESSAGE = 'Something went wrong — check your connection and try again.'

export default function Admin() {
  const [bio, setBio] = useState<PortfolioBio | null>(null)
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [experience, setExperience] = useState<PortfolioExperience[]>([])
  const { toast, show: showToast } = useToast()
  const [error, setError] = useState('')

  const load = useCallback(async () => {
      setError('')
      try {
        const [bioRes, projectsRes, experienceRes] = await Promise.all([
          getPortfolioBio(),
          listPortfolioProjects(),
          listPortfolioExperience(),
        ])
        setBio(bioRes.data)
        setProjects(projectsRes.data)
        setExperience(experienceRes.data)
      } catch {
        setError('Failed to load portfolio content.')
      }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const flashSaved = () => showToast('Saved')

  async function withErrorHandling(action: () => Promise<void>) {
    try {
      setError('')
      await action()
    } catch {
      setError(ERROR_MESSAGE)
    }
  }

  function useCrudActions<T extends { id: number }>(
    setItems: React.Dispatch<React.SetStateAction<T[]>>,
    api: {
      create: (payload: never) => Promise<{ data: T }>
      update: (id: number, payload: never) => Promise<{ data: T }>
      remove: (id: number) => Promise<unknown>
    },
  ) {
    return {
      add: (payload: never) =>
        withErrorHandling(async () => {
          const res = await api.create(payload)
          setItems((prev) => [...prev, res.data])
        }),
      save: (id: number, payload: never) =>
        withErrorHandling(async () => {
          const res = await api.update(id, payload)
          setItems((prev) => prev.map((item) => (item.id === id ? res.data : item)))
          flashSaved()
        }),
      remove: (id: number, confirmMessage: string) => {
        if (!confirm(confirmMessage)) return Promise.resolve()
        return withErrorHandling(async () => {
          await api.remove(id)
          setItems((prev) => prev.filter((item) => item.id !== id))
        })
      },
    }
  }

  const projectActions = useCrudActions<PortfolioProject>(setProjects, {
    create: createPortfolioProject,
    update: updatePortfolioProject,
    remove: deletePortfolioProject,
  })

  const experienceActions = useCrudActions<PortfolioExperience>(setExperience, {
    create: createPortfolioExperience,
    update: updatePortfolioExperience,
    remove: deletePortfolioExperience,
  })

  async function handleSaveBio(e: React.FormEvent) {
    e.preventDefault()
    if (!bio) return
    await withErrorHandling(async () => {
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
    })
  }

  const handleAddProject = () =>
    projectActions.add({
      name: 'New Project',
      description: '',
      tags: [],
      sort_order: projects.length,
    } as never)

  const handleSaveProject = (project: PortfolioProject) =>
    projectActions.save(project.id, {
      name: project.name,
      description: project.description,
      tags: project.tags,
      link: project.link,
      sort_order: project.sort_order,
    } as never)

  const handleDeleteProject = (id: number) => projectActions.remove(id, 'Delete this project?')

  const handleAddExperience = () =>
    experienceActions.add({
      role: 'New Role',
      company: '',
      period: '',
      bullets: [],
      sort_order: experience.length,
    } as never)

  const handleSaveExperience = (entry: PortfolioExperience) =>
    experienceActions.save(entry.id, {
      role: entry.role,
      company: entry.company,
      period: entry.period,
      bullets: entry.bullets,
      sort_order: entry.sort_order,
    } as never)

  const handleDeleteExperience = (id: number) =>
    experienceActions.remove(id, 'Delete this experience entry?')

  if (error && !bio) {
    return (
      <ErrorPanel
        title={error}
        detail="The portfolio content couldn't be fetched. Check that the backend is running and you're signed in, then try again."
        onRetry={load}
      />
    )
  }
  if (!bio) {
    return (
      <LoadingRegion label="Loading portfolio content…">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          <Skeleton className="h-[380px] rounded-panel" />
          <Skeleton className="h-[240px] rounded-panel" />
        </div>
      </LoadingRegion>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <p className="text-sm text-muted">Edit the content shown on your public portfolio.</p>

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-control border border-line bg-surface px-4 py-3 text-sm text-fg">
          <AlertIcon size={16} className="shrink-0 text-brand-text" />
          {error}
        </p>
      )}

      <BioForm bio={bio} onChange={setBio} onSubmit={handleSaveBio} />
      <ProjectsEditor
        projects={projects}
        onPatch={(id, patch) => setProjects((prev) => patchItem(prev, id, patch))}
        onAdd={handleAddProject}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
      />
      <ExperienceEditor
        entries={experience}
        onPatch={(id, patch) => setExperience((prev) => patchItem(prev, id, patch))}
        onAdd={handleAddExperience}
        onSave={handleSaveExperience}
        onDelete={handleDeleteExperience}
      />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  )
}
