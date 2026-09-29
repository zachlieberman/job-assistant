import { useEffect, useState } from 'react'
import { PortfolioBio, getPortfolioBio } from '../api/client'

export default function Contact() {
  const [bio, setBio] = useState<PortfolioBio | null>(null)

  useEffect(() => {
    getPortfolioBio().then((res) => setBio(res.data))
  }, [])

  if (!bio) return <p className="text-gray-500">Loading...</p>

  const links = [
    bio.email && { label: 'Email', href: `mailto:${bio.email}`, value: bio.email },
    bio.github_url && {
      label: 'GitHub',
      href: bio.github_url,
      value: bio.github_url.replace(/^https?:\/\//, ''),
    },
    bio.linkedin_url && {
      label: 'LinkedIn',
      href: bio.linkedin_url,
      value: bio.linkedin_url.replace(/^https?:\/\//, ''),
    },
  ].filter((link): link is { label: string; href: string; value: string } => Boolean(link))

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-bold text-white mb-4">Get in Touch</h1>
      <p className="text-gray-400 leading-relaxed mb-8">
        Feel free to reach out — happy to talk about opportunities, projects, or anything else.
      </p>
      <div className="space-y-3">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith('http') ? '_blank' : undefined}
            rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
            className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3 hover:border-gray-700 transition-colors"
          >
            <span className="text-sm font-medium text-gray-300">{link.label}</span>
            <span className="text-sm text-indigo-400">{link.value}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
