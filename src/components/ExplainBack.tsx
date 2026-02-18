import { useState } from 'react'
import { evaluateExplanation } from '../api'
import type { EvaluationResult } from '../api'
import { useProgressStore } from '../progress-store'

interface Props {
  topic: string
  content: string
  nodeId: string
  rootTopic: string
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-lg ${i <= count ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
      ))}
    </div>
  )
}

export default function ExplainBack({ topic, content, nodeId, rootTopic }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [error, setError] = useState('')

  const saveResult = useProgressStore(s => s.saveExplainBackResult)
  const existingResult = useProgressStore(s => s.topics[rootTopic]?.explainBackResults?.[nodeId])

  async function handleSubmit() {
    if (!text.trim() || text.trim().length < 20) return
    setLoading(true)
    setError('')
    try {
      const res = await evaluateExplanation(topic, content, text)
      setResult(res)
      saveResult(rootTopic, nodeId, res.score)
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate')
    } finally {
      setLoading(false)
    }
  }

  function handleRetry() {
    setText('')
    setResult(null)
    setError('')
  }

  if (result) {
    return (
      <div className="mt-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Your Evaluation</h3>
          <Stars count={result.score} />
        </div>

        {result.gotRight.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">✓ What you got right</h4>
            <ul className="space-y-1">
              {result.gotRight.map((item, i) => (
                <li key={i} className="text-sm text-slate-600 pl-3 border-l-2 border-emerald-300">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {result.missed.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">△ What you missed</h4>
            <ul className="space-y-1">
              {result.missed.map((item, i) => (
                <li key={i} className="text-sm text-slate-600 pl-3 border-l-2 border-amber-300">{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-brand-50 rounded-xl p-4 mt-3">
          <h4 className="text-xs font-semibold text-brand-700 uppercase tracking-wider mb-1">📝 Corrected Explanation</h4>
          <p className="text-sm text-slate-700 leading-relaxed">{result.correctedExplanation}</p>
        </div>

        <button
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🪶</span>
        <h3 className="text-sm font-semibold text-slate-700">Explain It Back</h3>
        {existingResult && (
          <span className="ml-auto text-xs text-slate-400">
            Last: <Stars count={existingResult.score} />
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 mb-3">Explain this concept in your own words to test your understanding (Feynman Technique)</p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="In my own words, this concept is about..."
        className="w-full h-28 px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent resize-none transition-all"
        disabled={loading}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-slate-400">{text.trim().length < 20 ? `${20 - text.trim().length} more characters needed` : '✓ Ready to submit'}</span>
        <button
          onClick={handleSubmit}
          disabled={loading || text.trim().length < 20}
          className="px-5 py-2 bg-gradient-to-r from-brand-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:from-brand-600 hover:to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Evaluating...
            </>
          ) : 'Submit'}
        </button>
      </div>
    </div>
  )
}
