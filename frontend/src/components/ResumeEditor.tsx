interface Props {
  label?: string
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
}

export default function ResumeEditor({ label, value, onChange, readOnly = false }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
      <textarea
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        rows={20}
        className={`w-full bg-gray-900 border rounded-xl p-4 text-sm text-gray-200 font-mono resize-y focus:outline-none transition-colors leading-relaxed ${
          readOnly
            ? 'border-gray-800 text-gray-400 cursor-default'
            : 'border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
        }`}
      />
    </div>
  )
}
