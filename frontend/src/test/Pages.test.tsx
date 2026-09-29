import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Admin from '../pages/Admin'
import ApplicationDetail from '../pages/ApplicationDetail'
import InterviewPrep from '../pages/InterviewPrep'
import Journey from '../pages/Journey'
import Profile from '../pages/Profile'
import { patchItem } from '../lib/patchItem'
import { makeApp } from './fixtures'

vi.mock('../api/client', () => ({
  getPortfolioBio: vi.fn(), listPortfolioProjects: vi.fn(), listPortfolioExperience: vi.fn(),
  updatePortfolioBio: vi.fn(), createPortfolioProject: vi.fn(), updatePortfolioProject: vi.fn(),
  deletePortfolioProject: vi.fn(), createPortfolioExperience: vi.fn(), updatePortfolioExperience: vi.fn(),
  deletePortfolioExperience: vi.fn(),
  getApplication: vi.fn(), updateApplication: vi.fn(), deleteApplication: vi.fn(), tailorResume: vi.fn(),
  generateCoverLetter: vi.fn(), listResumes: vi.fn(), getResume: vi.fn(), generateInterviewPrep: vi.fn(),
  getApplicationJourney: vi.fn(), getProfile: vi.fn(), updateProfile: vi.fn(), createResume: vi.fn(),
  updateResume: vi.fn(), deleteResume: vi.fn(),
}))

const api = async () => await import('../api/client')
const ok = (data: unknown) => Promise.resolve({ data }) as never

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('patchItem', () => {
  it('returns a new list and leaves the original untouched', () => {
    const items = [{ id: 1, n: 'a' }, { id: 2, n: 'b' }]
    const next = patchItem(items, 2, { n: 'z' })
    expect(next).toEqual([{ id: 1, n: 'a' }, { id: 2, n: 'z' }])
    expect(items[1].n).toBe('b')
  })
})

describe('Admin', () => {
  const bio = { id: 1, name: 'Zed', title: 'Dev', location: null, bio: 'hi', email: null, github_url: null, linkedin_url: null }
  const project = { id: 5, name: 'Proj', description: 'd', tags: ['a'], link: null, sort_order: 0 }
  const job = { id: 6, role: 'Eng', company: 'Co', period: '2024', bullets: ['x'], sort_order: 0 }

  async function load() {
    const c = await api()
    vi.mocked(c.getPortfolioBio).mockReturnValue(ok(bio))
    vi.mocked(c.listPortfolioProjects).mockReturnValue(ok([project]))
    vi.mocked(c.listPortfolioExperience).mockReturnValue(ok([job]))
    render(<MemoryRouter><Admin /></MemoryRouter>)
    await screen.findByLabelText('Project name')
    return c
  }

  it('shows an error with retry when loading fails', async () => {
    const c = await api()
    vi.mocked(c.getPortfolioBio).mockRejectedValue(new Error('x'))
    vi.mocked(c.listPortfolioProjects).mockReturnValue(ok([]))
    vi.mocked(c.listPortfolioExperience).mockReturnValue(ok([]))
    render(<MemoryRouter><Admin /></MemoryRouter>)
    expect(await screen.findByText('Failed to load portfolio content.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('has visible labels and saves the bio', async () => {
    const c = await load()
    vi.mocked(c.updatePortfolioBio).mockReturnValue(ok(bio))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save bio' }))
    await waitFor(() => expect(c.updatePortfolioBio).toHaveBeenCalledWith(expect.objectContaining({ name: 'New' })))
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('edits, saves, adds and deletes projects and experience', async () => {
    const c = await load()
    vi.mocked(c.updatePortfolioProject).mockReturnValue(ok(project))
    vi.mocked(c.createPortfolioProject).mockReturnValue(ok({ ...project, id: 7 }))
    vi.mocked(c.deletePortfolioProject).mockResolvedValue({} as never)
    vi.mocked(c.updatePortfolioExperience).mockReturnValue(ok(job))
    vi.mocked(c.createPortfolioExperience).mockReturnValue(ok({ ...job, id: 8 }))
    vi.mocked(c.deletePortfolioExperience).mockResolvedValue({} as never)

    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'a, b' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'dd' } })
    fireEvent.change(screen.getByLabelText('Link (optional)'), { target: { value: 'http://x' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0])
    await waitFor(() => expect(c.updatePortfolioProject).toHaveBeenCalledWith(5, expect.objectContaining({ tags: ['a', 'b'] })))

    fireEvent.change(screen.getByLabelText('Highlights'), { target: { value: 'one\ntwo' } })
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'R' } })
    fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'C' } })
    fireEvent.change(screen.getByLabelText('Period'), { target: { value: 'P' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[1])
    await waitFor(() => expect(c.updatePortfolioExperience).toHaveBeenCalledWith(6, expect.objectContaining({ bullets: ['one', 'two'] })))

    fireEvent.click(screen.getByRole('button', { name: /add project/i }))
    await waitFor(() => expect(c.createPortfolioProject).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /add job/i }))
    await waitFor(() => expect(c.createPortfolioExperience).toHaveBeenCalled())
    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0])
    await waitFor(() => expect(c.deletePortfolioProject).toHaveBeenCalled())
    fireEvent.click(screen.getAllByRole('button', { name: /delete/i }).slice(-1)[0])
    await waitFor(() => expect(c.deletePortfolioExperience).toHaveBeenCalled())
  })

  it('shows an alert when an action fails', async () => {
    const c = await load()
    vi.mocked(c.updatePortfolioBio).mockRejectedValue(new Error('x'))
    fireEvent.click(screen.getByRole('button', { name: 'Save bio' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i)
  })
})

describe('ApplicationDetail', () => {
  const app = makeApp({ id: 3, company: 'Acme', location: 'NYC', salary_range: '$1', job_url: 'http://job', job_description: 'JD text', resume_id: 1, tailored_resume: 'tailored' })
  const resume = { id: 1, name: 'Main', content: 'resume body', created_at: '', updated_at: '' }

  async function load(resumes: unknown[] = [resume]) {
    const c = await api()
    vi.mocked(c.getApplication).mockReturnValue(ok(app))
    vi.mocked(c.listResumes).mockReturnValue(ok(resumes))
    vi.mocked(c.updateApplication).mockReturnValue(ok(app))
    render(
      <MemoryRouter initialEntries={['/tracker/applications/3']}>
        <Routes>
          <Route path="/tracker/applications/:id" element={<ApplicationDetail />} />
          <Route path="/tracker" element={<p>dashboard</p>} />
        </Routes>
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { name: 'Acme' })
    return c
  }

  it('shows an error with retry when the application cannot load', async () => {
    const c = await api()
    vi.mocked(c.getApplication).mockRejectedValue(new Error('x'))
    vi.mocked(c.listResumes).mockReturnValue(ok([]))
    render(<MemoryRouter initialEntries={['/tracker/applications/3']}><Routes><Route path="/tracker/applications/:id" element={<ApplicationDetail />} /></Routes></MemoryRouter>)
    expect(await screen.findByText('Failed to load application.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('renders details and saves edits', async () => {
    const c = await load()
    expect(screen.getByText('NYC')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'offer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(c.updateApplication).toHaveBeenCalledWith('3', expect.objectContaining({ status: 'offer' })))
    expect(await screen.findByText('Changes saved')).toBeInTheDocument()
  })

  it('tailors the resume and lists keyword matches', async () => {
    const c = await load()
    vi.mocked(c.tailorResume).mockReturnValue(ok({ tailored_resume: 'new', changes: [], keyword_matches: ['react'], missing_keywords: ['go'] }))
    fireEvent.click(screen.getByRole('button', { name: 'Tailor resume' }))
    expect(await screen.findByText('react')).toBeInTheDocument()
    expect(screen.getByText('go')).toBeInTheDocument()
  })

  it('generates a cover letter', async () => {
    const c = await load()
    vi.mocked(c.generateCoverLetter).mockReturnValue(ok({ cover_letter: 'Dear team' }))
    fireEvent.click(screen.getByRole('button', { name: 'Generate cover letter' }))
    await waitFor(() => expect(c.generateCoverLetter).toHaveBeenCalledWith('resume body', 'JD text', 'Acme', 'professional'))
  })

  it('surfaces a failed AI action', async () => {
    const c = await load()
    vi.mocked(c.tailorResume).mockRejectedValue(new Error('x'))
    fireEvent.click(screen.getByRole('button', { name: 'Tailor resume' }))
    expect((await screen.findAllByText('Failed to tailor resume.')).length).toBeGreaterThan(0)
  })

  it('points to the profile when there are no resumes', async () => {
    await load([])
    expect(screen.getByRole('link', { name: /add a resume in your profile/i })).toBeInTheDocument()
  })

  it('edits and collapses a document section', async () => {
    await load()
    const section = screen.getByRole('button', { name: 'Notes' }).closest('section') as HTMLElement
    fireEvent.click(within(section).getByRole('button', { name: 'Edit' }))
    fireEvent.change(within(section).getByLabelText('Notes'), { target: { value: 'call Fri' } })
    fireEvent.click(within(section).getByRole('button', { name: 'Done' }))
    expect(within(section).getByText('call Fri')).toBeInTheDocument()
    fireEvent.click(within(section).getByRole('button', { name: 'Notes' }))
    expect(within(section).queryByText('call Fri')).not.toBeInTheDocument()
  })

  it('deletes after confirmation and returns to the dashboard', async () => {
    const c = await load()
    vi.mocked(c.deleteApplication).mockResolvedValue({} as never)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(await screen.findByText('dashboard')).toBeInTheDocument()
  })

  it('copies text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    await load()
    fireEvent.click(screen.getAllByRole('button', { name: 'Copy' })[0])
    expect(await screen.findByText('Copied')).toBeInTheDocument()
  })
})

describe('InterviewPrep', () => {
  const setup = async (fail = false) => {
    const c = await api()
    if (fail) vi.mocked(c.getApplication).mockRejectedValue(new Error('x'))
    else vi.mocked(c.getApplication).mockReturnValue(ok(makeApp({ id: 2, company: 'Acme', role: 'Eng', tailored_resume: 'r' })))
    render(<MemoryRouter initialEntries={['/tracker/interview/2']}><Routes><Route path="/tracker/interview/:id" element={<InterviewPrep />} /></Routes></MemoryRouter>)
    return c
  }

  it('offers retry when the application fails to load', async () => {
    await setup(true)
    expect(await screen.findByText('Failed to load application.')).toBeInTheDocument()
  })

  it('toggles question types and generates questions', async () => {
    const c = await setup()
    vi.mocked(c.generateInterviewPrep).mockReturnValue(ok({ questions: [{ question: 'Why?', type: 'technical', tip: 'Be brief' }] }))
    await screen.findByText(/Acme — Eng/)
    fireEvent.click(screen.getByLabelText('technical'))
    fireEvent.click(screen.getByLabelText('behavioral'))
    fireEvent.click(screen.getByLabelText('technical'))
    expect(screen.getByText(/Choose at least one/)).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('culture'))
    fireEvent.click(screen.getByRole('button', { name: 'Generate questions' }))
    expect(await screen.findByText('Why?')).toBeInTheDocument()
    expect(c.generateInterviewPrep).toHaveBeenCalledWith('', 'r', ['culture'])
  })

  it('explains a generation failure', async () => {
    const c = await setup()
    vi.mocked(c.generateInterviewPrep).mockRejectedValue(new Error('x'))
    await screen.findByText(/Acme — Eng/)
    fireEvent.click(screen.getByRole('button', { name: 'Generate questions' }))
    expect(await screen.findByText('Failed to generate questions.')).toBeInTheDocument()
  })
})

describe('Journey', () => {
  it('renders the diagram with its table alternative', async () => {
    const c = await api()
    vi.mocked(c.getApplicationJourney).mockReturnValue(ok({ nodes: [{ name: 'applied' }, { name: 'offer' }], links: [{ source: 0, target: 1, value: 2 }] }))
    render(<Journey />)
    expect(await screen.findByRole('img', { name: /Sankey diagram/ })).toBeInTheDocument()
    expect(screen.getByRole('table', { hidden: true })).toHaveTextContent('Offer')
  })

  it('shows an empty message when there is no data', async () => {
    const c = await api()
    vi.mocked(c.getApplicationJourney).mockReturnValue(ok({ nodes: [], links: [] }))
    render(<Journey />)
    expect(await screen.findByText(/No journey data yet/)).toBeInTheDocument()
  })

  it('explains a failure and retries', async () => {
    const c = await api()
    vi.mocked(c.getApplicationJourney).mockRejectedValueOnce(new Error('x'))
    render(<Journey />)
    expect(await screen.findByText('Failed to load your journey.')).toBeInTheDocument()
    vi.mocked(c.getApplicationJourney).mockReturnValueOnce(ok({ nodes: [], links: [] }))
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText(/No journey data yet/)).toBeInTheDocument()
  })
})

describe('Profile', () => {
  const resume = { id: 1, name: 'Main', content: 'body text', created_at: '', updated_at: '' }
  async function load(list: unknown[] = [resume]) {
    const c = await api()
    vi.mocked(c.getProfile).mockReturnValue(ok({ linkedin_url: 'li', github_url: 'gh' }))
    vi.mocked(c.listResumes).mockReturnValue(ok(list))
    render(<MemoryRouter><Profile /></MemoryRouter>)
    await screen.findByLabelText('LinkedIn URL')
    return c
  }

  it('saves links', async () => {
    const c = await load()
    vi.mocked(c.updateProfile).mockReturnValue(ok({}))
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    await waitFor(() => expect(c.updateProfile).toHaveBeenCalledWith({ linkedin_url: 'li', github_url: 'gh' }))
    expect(await screen.findByText('Profile saved')).toBeInTheDocument()
  })

  it('shows a helpful empty state and adds a resume', async () => {
    const c = await load([])
    expect(screen.getByText('No resumes yet.')).toBeInTheDocument()
    vi.mocked(c.createResume).mockReturnValue(ok({ ...resume, id: 2, name: 'New' }))
    fireEvent.click(screen.getByRole('button', { name: /add resume/i }))
    expect(screen.getByRole('button', { name: 'Save resume' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New' } })
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'text' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save resume' }))
    expect(await screen.findByText('Resume added')).toBeInTheDocument()
  })

  it('edits and deletes a resume', async () => {
    const c = await load()
    vi.mocked(c.updateResume).mockReturnValue(ok({ ...resume, name: 'Renamed' }))
    vi.mocked(c.deleteResume).mockResolvedValue({} as never)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Renamed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Renamed')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    await waitFor(() => expect(c.deleteResume).toHaveBeenCalledWith(1))
  })

  it('cancels adding a resume', async () => {
    await load()
    fireEvent.click(screen.getByRole('button', { name: /add resume/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('New resume')).not.toBeInTheDocument()
  })
})

describe('safeUrl', () => {
  it('allows only http(s) links', async () => {
    const { safeUrl } = await import('../components/detail/DetailHeader')
    expect(safeUrl('https://a.com/x')).toBe('https://a.com/x')
    expect(safeUrl('javascript:alert(1)')).toBeNull()
    expect(safeUrl('data:text/html,hi')).toBeNull()
    expect(safeUrl('not a url')).toBeNull()
    expect(safeUrl(null)).toBeNull()
  })
})
