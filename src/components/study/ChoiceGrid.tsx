export interface ChoiceGridProps {
  options: string[]
  selectedIndex: number | null
  correctIndex: number | null
  onSelect: (index: number) => void
}

export function ChoiceGrid({ options, selectedIndex, correctIndex, onSelect }: ChoiceGridProps) {
  const answered = correctIndex !== null

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((option, index) => {
        const selected = selectedIndex === index
        const correct = answered && correctIndex === index
        const wrong = answered && selected && !correct
        const state = correct
          ? 'border-green-400 bg-green-50 text-green-800'
          : wrong
            ? 'border-red-400 bg-red-50 text-red-800'
            : selected
              ? 'border-neutral-900 bg-neutral-900 text-white'
              : 'border-neutral-300 hover:bg-neutral-100'

        return (
          <button
            key={option}
            type="button"
            disabled={answered}
            onClick={() => onSelect(index)}
            className={`rounded-md border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${state}`}
          >
            <span className="mr-2 opacity-60">{index + 1}.</span>
            {option}
          </button>
        )
      })}
    </div>
  )
}
