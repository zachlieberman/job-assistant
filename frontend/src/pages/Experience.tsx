import { useEffect, useState } from 'react'
import { PortfolioExperience, listPortfolioExperience } from '../api/client'

export default function Experience() {
  const [jobs, setJobs] = useState<PortfolioExperience[] | null>(null)

  useEffect(() => {
    listPortfolioExperience().then((res) => setJobs(res.data))
  }, [])

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-white mb-8">Experience</h1>
      {!jobs ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-8">
          {jobs.map((job) => (
            <div key={job.id} className="border-l-2 border-gray-800 pl-5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h3 className="text-lg font-semibold text-white">{job.role}</h3>
                <span className="text-gray-500">·</span>
                <span className="text-gray-400">{job.company}</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{job.period}</p>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                {job.bullets.map((bullet, j) => (
                  <li key={j}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
