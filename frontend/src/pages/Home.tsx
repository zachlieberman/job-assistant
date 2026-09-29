import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="max-w-3xl">
      <p className="text-indigo-400 font-medium mb-3">Hi, I'm</p>
      <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">Your Name</h1>
      <h2 className="text-xl sm:text-2xl text-gray-400 mb-6">Software Engineer</h2>
      <p className="text-gray-400 leading-relaxed mb-8">
        A short bio goes here — what you build, what you're into, and what you're looking for next.
        Replace this paragraph with a couple sentences about yourself.
      </p>
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
