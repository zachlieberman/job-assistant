import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PortfolioBio, getPortfolioBio } from '../api/client'

export default function Home() {
  const [bio, setBio] = useState<PortfolioBio | null>(null)

  useEffect(() => {
    getPortfolioBio().then((res) => setBio(res.data))
  }, [])

  if (!bio) return <p className="text-gray-500">Loading...</p>

  return (
    <div className="max-w-3xl">
      <p className="text-indigo-400 font-medium mb-3">Hi, I'm</p>
      <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">{bio.name}</h1>
      <h2 className="text-xl sm:text-2xl text-gray-400 mb-1">{bio.title}</h2>
      {bio.location && <p className="text-gray-500 text-sm mb-6">{bio.location}</p>}
      <p className="text-gray-400 leading-relaxed mb-8 whitespace-pre-line">{bio.bio}</p>
      <div className="flex gap-3">
        <Link
          to="/projects"
          className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors"
        >
          View Projects
        </Link>
        <Link
          to="/contact"
          className="px-4 py-2 rounded-md border border-gray-700 hover:border-gray-600 text-gray-200 text-sm font-medium transition-colors"
        >
          Get in Touch
        </Link>
      </div>
    </div>
  )
}
