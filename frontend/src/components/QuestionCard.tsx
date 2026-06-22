const typeColors: Record<string, string> = {
  behavioral: 'bg-blue-900 text-blue-300',
  technical: 'bg-purple-900 text-purple-300',
  culture: 'bg-green-900 text-green-300',
}

interface Props {
  question: string
  type: string
  tip: string
}

export default function QuestionCard({ question, type, tip }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${
            typeColors[type] ?? 'bg-gray-800 text-gray-400'
          }`}
        >
          {type}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-100">{question}</p>
      <p className="text-xs text-gray-400 border-l-2 border-indigo-600 pl-3">{tip}</p>
    </div>
  )
}
