import type { SankeyData } from '../api/client'

// Hard-coded sample so the public demo never touches the API or auth.
export const SAMPLE_JOURNEY: SankeyData = {
  nodes: [
    { name: 'applied' },
    { name: 'recruiter_screen' },
    { name: 'interview' },
    { name: 'final_interview' },
    { name: 'offer' },
    { name: 'rejected' },
  ],
  links: [
    { source: 0, target: 1, value: 18 },
    { source: 0, target: 5, value: 22 },
    { source: 1, target: 2, value: 10 },
    { source: 1, target: 5, value: 8 },
    { source: 2, target: 3, value: 5 },
    { source: 2, target: 5, value: 5 },
    { source: 3, target: 4, value: 3 },
    { source: 3, target: 5, value: 2 },
  ],
}

// Ink for stages still in play, body gray for ended applications.
export const JOURNEY_COLORS: Record<string, string> = {
  applied: '#0A0C10',
  recruiter_screen: '#0A0C10',
  interview: '#0A0C10',
  final_interview: '#0A0C10',
  offer: '#0A0C10',
  rejected: '#5A5F68',
}

export const JOURNEY_LABELS: Record<string, string> = {
  applied: 'Applied',
  recruiter_screen: 'Recruiter screen',
  interview: 'Interview',
  final_interview: 'Final interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

export interface JourneyRow {
  from: string
  to: string
  value: number
}

/** Flattens links into rows for the plain-text table alternative. */
export function journeyRows(
  data: SankeyData,
  labels: Record<string, string>,
): JourneyRow[] {
  const label = (index: number) => labels[data.nodes[index].name] ?? data.nodes[index].name
  return data.links.map((link) => ({
    from: label(link.source),
    to: label(link.target),
    value: link.value,
  }))
}
