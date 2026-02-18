import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLearningStore } from '../store'
import type { NarrationStyle } from '../store'
import { generateSyllabus } from '../api'

function makeId(title: string, layer: number) {
  return `${layer}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${Math.random().toString(36).slice(2, 6)}`
}

const STYLES: { value: NarrationStyle; label: string; desc: string; icon: string }[] = [
  { value: 'academic', label: 'Academic', desc: 'Formal & textbook-like', icon: '📚' },
  { value: 'casual', label: 'Casual', desc: 'Conversational & friendly', icon: '💬' },
  { value: 'eli5', label: 'ELI5', desc: 'Simple & fun', icon: '🧒' },
  { value: 'storytelling', label: 'Storytelling', desc: 'Narrative & analogies', icon: '📖' },
]

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const store = useLearningStore()
  const [style, setStyle] = useState<NarrationStyle>('casual')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    store.reset()
    store.setNarrationStyle(style)
    try {
      const data = await generateSyllabus(query.trim(), 1, query.trim(), [], style)
      // New format: single object with content and subtopics
      const rootNode = {
        id: makeId(query.trim(), 0),
        title: data.title || query.trim(),
        description: '',
        content: data.content,
        layer: 0,
        parentPath: [],
        children: (data.subtopics || []).map((st: string) => ({
          id: makeId(st, 1),
          title: st,
          description: '',
          layer: 1,
          parentPath: [query.trim()],
        })),
      }
      store.setRootTopic(query.trim())
      store.setTree([rootNode])
      navigate(`/learn/${rootNode.id}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold text-slate-800 mb-2">🎓</h1>
        <h2 className="text-3xl font-semibold text-slate-800 mb-8">What do you want to learn?</h2>
        <form onSubmit={handleSearch} className="flex flex-col gap-4 w-full max-w-lg mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. Quantum Physics, Machine Learning, Piano..."
              className="flex-1 px-5 py-3 rounded-xl border border-slate-300 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl text-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Generating...
                </span>
              ) : 'Explore'}
            </button>
          </div>

          {/* Narration Style Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STYLES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStyle(s.value)}
                className={`p-3 rounded-xl border text-left transition ${
                  style === s.value
                    ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-lg mb-0.5">{s.icon}</div>
                <div className="text-sm font-medium text-slate-800">{s.label}</div>
                <div className="text-xs text-slate-500">{s.desc}</div>
              </button>
            ))}
          </div>
        </form>
        {error && <p className="mt-4 text-red-500">{error}</p>}
      </div>
    </div>
  )
}
