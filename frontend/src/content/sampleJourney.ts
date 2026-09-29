import type { SankeyData } from '../api/client'

// Hard-coded sample so the public demo never touches the API or auth.
export const SAMPLE_JOURNEY: SankeyData = {
  nodes: [
    { name: 'applied' },
    { name: 'phone_screen' },
    { name: 'technical' },
    { name: 'offer' },
    { name: 'rejected' },
  ],
  links: [
    { source: 0, target: 1, value: 18 },
    { source: 0, target: 4, value: 22 },
    { source: 1, target: 2, value: 9 },
    { source: 1, target: 4, value: 9 },
    { source: 2, target: 3, value: 3 },
    { source: 2, target: 4, value: 6 },
  ],
}

// Ink for stages still in play, body gray for ended applications.
export const JOURNEY_COLORS: Record<string, string> = {
  applied: '#0A0C10',
  phone_screen: '#0A0C10',
  technical: '#0A0C10',
  offer: '#0A0C10',
  rejected: '#5A5F68',
}

export const JOURNEY_LABELS: Record<string, string> = {
  applied: 'Applied',
  phone_screen: 'Phone screen',
  technical: 'Technical',
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
