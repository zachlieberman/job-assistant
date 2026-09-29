import { useEffect, useState } from 'react'
import { PortfolioProject, listPortfolioProjects } from '../api/client'

export default function Projects() {
  const [projects, setProjects] = useState<PortfolioProject[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    listPortfolioProjects()
      .then((res) => setProjects(res.data))
      .catch(() => setError(true))
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Projects</h1>
      {error ? (
        <p className="text-red-400">Failed to load. Please refresh the page.</p>
      ) : !projects ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border border-gray-800 bg-gray-900/50 p-5 hover:border-gray-700 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                {project.link ? (
                  <a href={project.link} target="_blank" rel="noreferrer" className="hover:text-indigo-400">
                    {project.name} ↗
                  </a>
                ) : (
                  project.name
                )}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
