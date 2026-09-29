import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import ProjectCard from '../components/public/ProjectCard'
import type { PortfolioProject } from '../api/client'

const project: PortfolioProject = {
  id: 1,
  name: 'Job Assistant',
  description: 'Tracks applications.',
  tags: ['React', 'FastAPI'],
  link: 'https://example.com/app',
  sort_order: 0,
}

const renderCard = (p: PortfolioProject = project, featured = false) =>
  render(
    <MemoryRouter>
      <ProjectCard project={p} featured={featured} />
    </MemoryRouter>,
  )

describe('ProjectCard', () => {
  it('starts collapsed and toggles with a click', async () => {
    renderCard()
    const toggle = screen.getByRole('button', { name: /Job Assistant/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('toggles with Enter and Space from the keyboard', async () => {
    renderCard()
    const toggle = screen.getByRole('button', { name: /Job Assistant/ })
    await userEvent.tab()
    expect(toggle).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('links the button to its panel and lists tags', () => {
    renderCard()
    const toggle = screen.getByRole('button', { name: /Job Assistant/ })
    expect(document.getElementById(toggle.getAttribute('aria-controls')!)).toHaveTextContent(
      'Tracks applications.',
    )
    expect(screen.getByRole('list', { name: 'Technologies' })).toHaveTextContent('FastAPI')
  })

  it('opens the project link in a new tab safely', () => {
    renderCard()
    const link = screen.getByText('Visit project').closest('a')!
    expect(link).toHaveAttribute('href', 'https://example.com/app')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('drops unsafe or missing links', () => {
    renderCard({ ...project, link: 'javascript:alert(1)' })
    expect(screen.queryByText('Visit project')).not.toBeInTheDocument()
  })

  it('gives the featured card a wider treatment', () => {
    renderCard(project, true)
    expect(screen.getByRole('article')).toHaveClass('md:col-span-2')
  })
})
