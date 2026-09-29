import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getApplication, generateInterviewPrep, getResume, Application, InterviewQuestion } from '../api/client'
import QuestionCard from '../components/QuestionCard'
import ErrorPanel from '../components/ui/ErrorPanel'
import PageHeader from '../components/ui/PageHeader'
import { LoadingRegion, Skeleton } from '../components/ui/Skeleton'
import { buttonPrimary } from '../components/ui/formStyles'
import { CheckIcon } from '../components/icons'

const QUESTION_TYPES = ['behavioral', 'technical', 'culture'] as const

export default function InterviewPrep() {
  const { id } = useParams<{ id: string }>()
  const [app, setApp] = useState<Application | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['behavioral'])
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!id) return
    setLoadError(null)
    getApplication(id)
      .then((res) => setApp(res.data))
      .catch(() => setLoadError('Failed to load application.'))
  }, [id])

  useEffect(load, [load])

  function toggleType(type: string) {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  async function handleGenerate() {
    if (!selectedTypes.length || !app) return
    setLoading(true)
    setGenError(null)
    try {
      let resumeText = app.tailored_resume ?? ''
      if (!resumeText && app.resume_id) {
        const r = await getResume(app.resume_id)
        resumeText = r.data.content
      }
      const res = await generateInterviewPrep(app.job_description, resumeText, selectedTypes)
      setQuestions(res.data.questions)
    } catch {
      setGenError('Failed to generate questions.')
    } finally {
      setLoading(false)
    }
  }

  if (loadError && !app) {
    return <ErrorPanel title={loadError} detail="Check that the API is running and the application still exists, then try again." onRetry={load} />
  }
  if (!app) {
    return (
      <LoadingRegion label="Loading application…">
        <Skeleton className="h-[200px] rounded-panel" />
      </LoadingRegion>
    )
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <PageHeader title={`${app.company} — ${app.role}`} description="Practice questions based on this job description and your resume." />

      <fieldset className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-4 md:p-5">
        <legend className="px-1 text-sm font-medium text-fg">Question types</legend>
        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES.map((type) => {
            const checked = selectedTypes.includes(type)
            return (
              <label
                key={type}
                className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-control border px-3 text-sm capitalize transition-colors duration-150 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-text md:min-h-[36px] ${
                  checked ? 'border-brand-text bg-brand/15 text-brand-text' : 'border-field text-fg hover:bg-raised'
                }`}
              >
                <input type="checkbox" checked={checked} onChange={() => toggleType(type)} className="sr-only" />
                {checked && <CheckIcon size={15} />}
                {type}
              </label>
            )
          })}
        </div>
        <button type="button" onClick={handleGenerate} disabled={loading || !selectedTypes.length} className={`${buttonPrimary} w-fit`}>
          {loading ? 'Generating…' : 'Generate questions'}
        </button>
        {!selectedTypes.length && <p className="text-sm text-muted">Choose at least one question type to continue.</p>}
      </fieldset>

      {genError && (
        <ErrorPanel title={genError} detail="The AI service didn't return questions. Try again in a moment." onRetry={handleGenerate} />
      )}

      {loading && (
        <LoadingRegion label="Generating questions…">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-[110px] rounded-panel" />
            <Skeleton className="h-[110px] rounded-panel" />
          </div>
        </LoadingRegion>
      )}

      {!loading && questions.length > 0 && (
        <section aria-labelledby="questions-title" className="flex flex-col gap-3">
          <h2 id="questions-title" className="text-base font-semibold text-fg">{questions.length} questions</h2>
          {questions.map((q, i) => (
            <QuestionCard key={i} question={q.question} type={q.type} tip={q.tip} />
          ))}
        </section>
      )}
    </div>
  )
}
