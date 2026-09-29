import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { login, setAuthToken } from '../api/client'
import Field from '../components/ui/Field'
import { buttonPrimary, inputClass } from '../components/ui/formStyles'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string })?.from ?? '/tracker'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await login(username, password)
      setAuthToken(res.data.token)
      navigate(from, { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Incorrect username or password.')
      } else if (axios.isAxiosError(err) && err.response?.status === 429) {
        setError('Too many login attempts — try again in a few minutes.')
      } else {
        setError('Could not reach the server — check your connection and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-sm md:mt-20">
      <div className="rounded-panel border border-line bg-surface p-6">
        <h1 className="text-xl font-semibold tracking-tight text-fg">Sign in</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Your applications are private to you.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Field label="Username">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              autoComplete="username"
              autoFocus
            />
          </Field>
          <Field label="Password" error={error || null}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
          </Field>
          <button type="submit" disabled={submitting} className={`${buttonPrimary} mt-1 w-full`}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
