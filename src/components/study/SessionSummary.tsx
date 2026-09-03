export interface SessionSummaryProps {
  correct: number
  total: number
  boxUps: number
  boxDowns: number
  masteryPct: number
  daysUntilExam: number | null
  onStudyAgain: () => void
}

export function SessionSummary({ correct, total, boxUps, boxDowns, masteryPct, daysUntilExam, onStudyAgain }: SessionSummaryProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
      <h1 className="text-xl font-semibold text-neutral-900">Session complete</h1>
      <p className="text-3xl font-bold text-neutral-900">{correct} / {total}</p>
      <div className="grid grid-cols-2 gap-8 text-sm text-neutral-600">
        <div><p className="text-lg font-semibold text-green-700">{boxUps}</p><p>moved up</p></div>
        <div><p className="text-lg font-semibold text-red-700">{boxDowns}</p><p>dropped</p></div>
      </div>
      <p className="text-sm text-neutral-600">Mastery: {Math.round(masteryPct)}%</p>
      {daysUntilExam !== null && <p className="text-sm text-neutral-500">{daysUntilExam} days until your exam</p>}
      <button type="button" onClick={onStudyAgain} className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white">Study again</button>
    </div>
  )
}
