import { useState } from 'react'
import { generateQuiz } from '../api'
import type { QuizQuestion } from '../api'
import { useProgressStore } from '../progress-store'

interface Props {
  topic: string
  content: string
  nodeId: string
  rootTopic: string
}

export default function Quiz({ topic, content, nodeId, rootTopic }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState('')

  const saveQuizResult = useProgressStore(s => s.saveQuizResult)
  const existingResult = useProgressStore(s => s.getQuizResult(rootTopic, nodeId))

  async function handleStart() {
    setStarted(true)
    setLoading(true)
    setError('')
    try {
      const qs = await generateQuiz(topic, content)
      setQuestions(qs)
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz')
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(optionIndex: number) {
    if (selected !== null) return
    setSelected(optionIndex)
    if (optionIndex === questions[currentQ].correctIndex) {
      setScore(s => s + 1)
    }
  }

  function handleNext() {
    if (currentQ + 1 >= questions.length) {
      setFinished(true)
      saveQuizResult(rootTopic, nodeId, score, questions.length)
    } else {
      setCurrentQ(c => c + 1)
      setSelected(null)
    }
  }

  function handleRetry() {
    setStarted(false)
    setQuestions([])
    setCurrentQ(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
    setError('')
  }

  if (!started) {
    return (
      <div className="mt-6">
        <button
          onClick={handleStart}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-500 to-purple-500 text-white rounded-2xl font-semibold text-sm hover:from-brand-600 hover:to-purple-600 transition-all duration-300 active:scale-[0.98] shadow-lg shadow-brand-200/50 flex items-center justify-center gap-2"
        >
          <span className="text-lg">🧠</span>
          <span>Test Your Knowledge</span>
          {existingResult && (
            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
              Last: {existingResult.score}/{existingResult.total}
            </span>
          )}
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="text-3xl mb-3 animate-float">🧠</div>
        <p className="text-slate-500 text-sm">Generating quiz questions...</p>
        <div className="mt-4 h-2 w-32 mx-auto skeleton-shimmer rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm">
        {error}
        <button onClick={handleRetry} className="ml-3 underline">Try again</button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center animate-fade-in-up">
        <div className="text-4xl mb-3">{score === questions.length ? '🎉' : score >= questions.length / 2 ? '👏' : '💪'}</div>
        <h3 className="text-xl font-bold text-slate-800">{score}/{questions.length} correct!</h3>
        <p className="text-slate-500 text-sm mt-2">
          {score === questions.length ? 'Perfect score! You really know this topic!' : score >= questions.length / 2 ? 'Good job! Keep learning!' : 'Keep studying, you\'ll get there!'}
        </p>
        <button
          onClick={handleRetry}
          className="mt-4 px-5 py-2 bg-brand-50 text-brand-600 rounded-xl text-sm font-semibold hover:bg-brand-100 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  const q = questions[currentQ]
  if (!q) return null

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Question {currentQ + 1}/{questions.length}</span>
        <span className="text-xs font-medium text-brand-500">{score} correct so far</span>
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-4">{q.question}</h3>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let style = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
          if (selected !== null) {
            if (i === q.correctIndex) style = 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-300'
            else if (i === selected) style = 'bg-red-50 border-red-300 text-red-700 ring-1 ring-red-300'
            else style = 'bg-slate-50 border-slate-200 text-slate-400'
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200 ${style} ${selected === null ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'}`}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          )
        })}
      </div>
      {selected !== null && (
        <div className="mt-4 animate-fade-in">
          <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 mb-3">
            <span className="font-semibold">💡 </span>{q.explanation}
          </div>
          <button
            onClick={handleNext}
            className="px-5 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors"
          >
            {currentQ + 1 >= questions.length ? 'See Results' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  )
}
