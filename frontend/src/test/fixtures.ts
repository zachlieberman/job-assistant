import type { Application } from '../api/client'

export const makeApp = (overrides: Partial<Application> = {}): Application => ({
  id: 1,
  company: 'Acme',
  role: 'Engineer',
  status: 'applied',
  date_applied: '2024-01-15',
  job_url: null,
  job_description: '',
  resume_id: null,
  tailored_resume: null,
  cover_letter: null,
  notes: null,
  location: null,
  salary_range: null,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  ...overrides,
})
