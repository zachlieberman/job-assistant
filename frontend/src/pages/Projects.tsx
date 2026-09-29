interface Project {
  name: string
  description: string
  tags: string[]
  link?: string
}

const projects: Project[] = [
  {
    name: 'Job Application Assistant',
    description:
      'This site — tracks job applications, tailors resumes, and generates cover letters and interview prep with Claude AI.',
    tags: ['React', 'FastAPI', 'PostgreSQL', 'Claude AI'],
  },
  {
    name: 'Project Name',
    description: 'A short description of what this project does and the problem it solves.',
    tags: ['Tech', 'Stack'],
  },
  {
    name: 'Project Name',
    description: 'A short description of what this project does and the problem it solves.',
    tags: ['Tech', 'Stack'],
  },
]

export default function Projects() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Projects</h1>
      <div className="grid sm:grid-cols-2 gap-5">
        {projects.map((project) => (
          <div
            key={project.name}
            className="rounded-lg border border-gray-800 bg-gray-900/50 p-5 hover:border-gray-700 transition-colors"
          >
            <h3 className="text-lg font-semibold text-white mb-2">{project.name}</h3>
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
    </div>
  )
}
