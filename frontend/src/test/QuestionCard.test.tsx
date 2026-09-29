import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import QuestionCard from '../components/QuestionCard'

describe('QuestionCard', () => {
  const baseProps = { question: 'Tell me about yourself.', type: 'behavioral', tip: 'Use the STAR method.' }

  it('renders the question and tip', () => {
    render(<QuestionCard {...baseProps} />)
    expect(screen.getByText('Tell me about yourself.')).toBeInTheDocument()
    expect(screen.getByText('Use the STAR method.')).toBeInTheDocument()
  })

  it.each(['behavioral', 'technical', 'culture'])('shows a label and icon for %s', (type) => {
    render(<QuestionCard {...baseProps} type={type} />)
    const badge = screen.getByText(type)
    expect(badge.querySelector('svg')).not.toBeNull()
  })

  it('uses the blue ramp instead of other hues', () => {
    render(<QuestionCard {...baseProps} type="technical" />)
    expect(screen.getByText('technical')).toHaveClass('text-stage-technical-fg')
  })

  it('falls back to a neutral badge for unknown types', () => {
    render(<QuestionCard {...baseProps} type="other" />)
    expect(screen.getByText('other')).toHaveClass('bg-raised')
  })
})
