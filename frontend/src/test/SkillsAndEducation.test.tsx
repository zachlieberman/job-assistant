import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SkillsAndEducation from '../components/public/SkillsAndEducation'
import { CERTIFICATIONS, EDUCATION, SKILL_GROUPS } from '../content/profile'

describe('SkillsAndEducation', () => {
  it('lists education and certifications under their own heading', () => {
    render(<SkillsAndEducation />)
    const section = screen.getByRole('region', { name: 'Education & certifications' })
    for (const entry of [...EDUCATION, ...CERTIFICATIONS]) {
      expect(within(section).getByText(entry.institution)).toBeInTheDocument()
    }
    expect(within(section).getByText(/B\.S\. Computer Science/)).toBeInTheDocument()
  })

  it('renders every skill group with all of its skills', () => {
    render(<SkillsAndEducation />)
    const section = screen.getByRole('region', { name: 'Skills' })
    for (const group of SKILL_GROUPS) {
      expect(within(section).getByRole('heading', { level: 3, name: group.label })).toBeInTheDocument()
      for (const skill of group.skills) {
        expect(within(section).getAllByText(skill).length).toBeGreaterThan(0)
      }
    }
  })

  it('keeps a sensible heading order (h2 sections, h3 groups)', () => {
    render(<SkillsAndEducation />)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(SKILL_GROUPS.length)
  })
})
