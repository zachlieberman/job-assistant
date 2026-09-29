import type { PrerenderData } from '../lib/prerenderData'

export const data: PrerenderData = {
  bio: {
    id: 1,
    name: 'Zachary Lieberman',
    title: 'Software Engineer',
    location: 'Los Angeles, CA',
    bio: 'I build careful software.',
    email: 'zach@example.com',
    github_url: 'https://github.com/zachlieberman',
    linkedin_url: null,
    updated_at: '',
  },
  projects: [
    { id: 1, name: 'Alpha Project', description: 'First', tags: ['Go'], link: null, sort_order: 0 },
  ],
  experience: [
    { id: 1, role: 'Engineer', company: 'Acme Corp', period: '2020', bullets: ['Did work'], sort_order: 0 },
  ],
}
