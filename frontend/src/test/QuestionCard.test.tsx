import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import QuestionCard from '../components/QuestionCard'

describe('QuestionCard', () => {
  const baseProps = {
    question: 'Tell me about yourself.',
    type: 'behavioral',
    tip: 'Use the STAR method.',
  }

  it('renders the question text', () => {
    render(<QuestionCard {...baseProps} />)
    expect(screen.getByText('Tell me about yourself.')).toBeInTheDocument()
  })

  it('renders the tip text', () => {
    render(<QuestionCard {...baseProps} />)
    expect(screen.getByText('Use the STAR method.')).toBeInTheDocument()
  })

  it('renders the type badge', () => {
    render(<QuestionCard {...baseProps} />)
    expect(screen.getByText('behavioral')).toBeInTheDocument()
  })

  it('applies blue color for behavioral type', () => {
    render(<QuestionCard {...baseProps} />)
    expect(screen.getByText('behavioral')).toHaveClass('text-blue-300')
  })

  it('applies purple color for technical type', () => {
    render(<QuestionCard {...baseProps} type="technical" />)
    expect(screen.getByText('technical')).toHaveClass('text-purple-300')
  })

  it('applies green color for culture type', () => {
    render(<QuestionCard {...baseProps} type="culture" />)
    expect(screen.getByText('culture')).toHaveClass('text-green-300')
  })

  it('applies fallback color for unknown type', () => {
    render(<QuestionCard {...baseProps} type="other" />)
    expect(screen.getByText('other')).toHaveClass('bg-gray-800')
  })
})
