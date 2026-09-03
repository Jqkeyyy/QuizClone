import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { TestConfigPanel } from '../components/test/TestConfigPanel'
import { TestQuestionCard } from '../components/test/TestQuestionCard'
import { TestReview } from '../components/test/TestReview'
import { useAuth } from '../hooks/useAuth'
import { useCards } from '../hooks/useCards'
import { useSetProgress } from '../hooks/useProgress'
import { useSet } from '../hooks/useSet'
import { useSaveTestResult, type SaveTestResultInput } from '../hooks/useTestResult'
import {
  buildTest,
  gradeTest,
  type GradedTest,
  type TestAnswer,
  type TestAnswers,
  type TestConfig,
  type TestQuestion,
} from '../lib/study/test'

type Stage = 'config' | 'run' | 'review'

function TestRunner({
  questions,
  answers,
  index,
  onAnswer,
  onIndexChange,
  onFinish,
}: {
  questions: TestQuestion[]
  answers: TestAnswers
  index: number
  onAnswer: (answer: TestAnswer) => void
  onIndexChange: (index: number) => void
  onFinish: () => void
}) {
  const question = questions[index]
  return (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between text-sm text-neutral-500">
          <span>Question {index + 1} of {questions.length}</span>
          <span>{Math.round(((index + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full bg-blue-600" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <section className="min-h-72 rounded-2xl border border-neutral-200 bg-white p-6">
        <TestQuestionCard
          key={question.id}
          question={question}
          answer={answers[question.id]}
          onAnswer={onAnswer}
        />
      </section>

      <div className="flex justify-between gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onIndexChange(index - 1)}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm disabled:opacity-40"
        >
          Previous
        </button>
        {index === questions.length - 1 ? (
          <button type="button" onClick={onFinish} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
            Finish and grade
          </button>
        ) : (
          <button type="button" onClick={() => onIndexChange(index + 1)} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
            Next
          </button>
        )}
      </div>
    </div>
  )
}

export default function Test() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: set, isPending: setPending, isError: setError } = useSet(id)
  const { data: cards, isPending: cardsPending, isError: cardsError } = useCards(id)
  const { data: progress, isPending: progressPending, isError: progressError } = useSetProgress(user?.id, id)
  const saveResult = useSaveTestResult()
  const eligibleCards = useMemo(
    () => (cards ?? []).filter((card) => card.term.trim().length > 0 && card.definition.trim().length > 0),
    [cards],
  )
  const progressByCardId = useMemo(
    () => new Map((progress ?? []).map((row) => [row.card_id, row])),
    [progress],
  )
  const [stage, setStage] = useState<Stage>('config')
  const [config, setConfig] = useState<TestConfig | null>(null)
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [answers, setAnswers] = useState<TestAnswers>({})
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<GradedTest | null>(null)

  if (setPending || cardsPending || progressPending) return <p className="text-sm text-neutral-500">Loading…</p>
  if (setError || cardsError || progressError || !set || !cards || !user || !id) {
    return <p className="text-sm text-red-600">Set not found or you don’t have access.</p>
  }

  function startTest(nextConfig: TestConfig) {
    const nextQuestions = buildTest(eligibleCards, progressByCardId, nextConfig)
    setConfig(nextConfig)
    setQuestions(nextQuestions)
    setAnswers({})
    setIndex(0)
    setResult(null)
    saveResult.reset()
    setStage('run')
  }

  function save(grading: GradedTest) {
    if (!config) return
    const input: SaveTestResultInput = {
      userId: user!.id,
      setId: id!,
      examDate: set!.exam_date,
      config,
      answers,
      result: grading,
      progressByCardId,
    }
    saveResult.mutate(input)
  }

  function finishTest() {
    const grading = gradeTest(questions, answers)
    setResult(grading)
    setStage('review')
    save(grading)
  }

  function retake() {
    setStage('config')
    setConfig(null)
    setQuestions([])
    setAnswers({})
    setResult(null)
    saveResult.reset()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to={`/set/${id}`} className="text-sm text-neutral-500 hover:text-neutral-700">← {set.title}</Link>

      {eligibleCards.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-500">Add complete terms and definitions before creating a test.</p>
          {user.id === set.owner_id && <Link to={`/set/${id}/edit`} className="mt-4 inline-block text-sm font-medium underline">Open editor</Link>}
        </div>
      ) : stage === 'config' ? (
        <TestConfigPanel cardCount={eligibleCards.length} onStart={startTest} />
      ) : stage === 'run' ? (
        <TestRunner
          questions={questions}
          answers={answers}
          index={index}
          onAnswer={(answer) => setAnswers((current) => ({ ...current, [questions[index].id]: answer }))}
          onIndexChange={setIndex}
          onFinish={finishTest}
        />
      ) : result ? (
        <TestReview
          result={result}
          saving={saveResult.isPending}
          saveError={saveResult.isError}
          onRetrySave={() => save(result)}
          onRetake={retake}
          onLearnMissed={() => navigate(`/set/${id}/learn?cards=${result.missedCardIds.join(',')}`)}
        />
      ) : null}
    </div>
  )
}
