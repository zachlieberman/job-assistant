import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getApplication, generateInterviewPrep, getResume, Application, InterviewQuestion } from '../api/client'
import QuestionCard from '../components/QuestionCard'

const QUESTION_TYPES = ['behavioral', 'technical', 'culture'] as const

export default function InterviewPrep() {
  const { id } = useParams<{ id: string }>()
  const [app, setApp] = useState<Application | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['behavioral'])
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getApplication(id)
      .then((res) => setApp(res.data))
      .catch(() => setError('Failed to load application.'))
  }, [id])

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  async function handleGenerate() {
    if (!selectedTypes.length || !app) return
    setLoading(true)
    setError(null)
    try {
      let resumeText = app.tailored_resume ?? ''
      if (!resumeText && app.resume_id) {
        const r = await getResume(app.resume_id)
        resumeText = r.data.content
      }
      const res = await generateInterviewPrep(app.job_description, resumeText, selectedTypes)
      setQuestions(res.data.questions)
    } catch {
      setError('Failed to generate questions.')
    } finally {
      setLoading(false)
    }
  }

  if (!app && !error) return <p className="text-gray-500">Loading...</p>
  if (error && !app) return <p className="text-red-400">{error}</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Interview Prep</h1>
        <p className="text-gray-400">{app!.company} — {app!.role}</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-400">Select question types:</p>
        <div className="flex gap-3">
          {QUESTION_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={() => toggleType(type)}
                className="accent-indigo-500"
              />
              <span className="text-sm capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !selectedTypes.length}
        className="w-fit bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-2 rounded text-sm font-medium transition-colors"
      >
        {loading ? 'Generating...' : 'Generate Questions'}
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {questions.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{questions.length} Questions</h2>
          {questions.map((q, i) => (
            <QuestionCard key={i} question={q.question} type={q.type} tip={q.tip} />
          ))}
        </div>
      )}
    </div>
  )
}
