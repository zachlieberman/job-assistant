import { useCallback, useEffect, useState } from 'react'
import { listApplications, type Application } from '../api/client'

interface State {
  applications: Application[]
  loading: boolean
  error: string | null
}

export function useApplications() {
  const [state, setState] = useState<State>({ applications: [], loading: true, error: null })

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await listApplications()
      setState({ applications: res.data, loading: false, error: null })
    } catch {
      setState((s) => ({ ...s, loading: false, error: 'Failed to load applications.' }))
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const updateStatus = useCallback((id: number, status: string) => {
    setState((s) => ({
      ...s,
      applications: s.applications.map((a) => (a.id === id ? { ...a, status } : a)),
    }))
  }, [])

  return { ...state, reload, updateStatus }
}
