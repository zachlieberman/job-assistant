import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { SearchIcon } from './icons'

export const SEARCH_PARAM = 'q'

/**
 * Filters the applications table by company or role. The query lives in the
 * URL (?q=) so the top bar and the Dashboard stay in sync without shared state.
 * On the Dashboard it filters as you type; elsewhere Enter jumps to the results.
 */
export default function SearchBox() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const onDashboard = pathname === '/tracker'
  const urlValue = params.get(SEARCH_PARAM) ?? ''
  const [draft, setDraft] = useState('')
  const value = onDashboard ? urlValue : draft

  function handleChange(next: string) {
    if (!onDashboard) return setDraft(next)
    const nextParams = new URLSearchParams(params)
    if (next) nextParams.set(SEARCH_PARAM, next)
    else nextParams.delete(SEARCH_PARAM)
    setParams(nextParams, { replace: true })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (onDashboard) return
    const q = draft.trim()
    navigate(q ? `/tracker?${SEARCH_PARAM}=${encodeURIComponent(q)}` : '/tracker')
    setDraft('')
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative w-full max-w-md">
      <label htmlFor="global-search" className="sr-only">
        Search applications by company or role
      </label>
      <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-text" />
      <input
        id="global-search"
        type="search"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search company or role…"
        autoComplete="off"
        className="h-11 w-full rounded-control border border-field bg-surface pl-9 pr-3 text-base text-fg transition-colors duration-150 placeholder:text-muted hover:border-muted focus-visible:border-brand-text md:h-9 md:text-sm"
      />
    </form>
  )
}
