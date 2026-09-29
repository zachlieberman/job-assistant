const links = [
  { label: 'Email', href: 'mailto:you@example.com', value: 'you@example.com' },
  { label: 'GitHub', href: 'https://github.com/your-username', value: 'github.com/your-username' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/your-username', value: 'linkedin.com/in/your-username' },
]

export default function Contact() {
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
