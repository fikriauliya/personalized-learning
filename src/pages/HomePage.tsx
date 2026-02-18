import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLearningStore } from '../store'
import { generateSyllabus } from '../api'

function makeId(title: string, layer: number) {
  return `${layer}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${Math.random().toString(36).slice(2, 6)}`
}

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const store = useLearningStore()

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    store.reset()
    try {
      const data = await generateSyllabus(query.trim(), 1, query.trim(), [])
      const nodes = data.map((item: any) => ({
        id: makeId(item.title, 1),
        title: item.title,
        description: item.description,
        layer: 1,
        parentPath: [query.trim()],
      }))
      store.setRootTopic(query.trim())
      store.setTree(nodes)
      navigate('/learn')
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
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full max-w-lg mx-auto">
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
        </form>
        {error && <p className="mt-4 text-red-500">{error}</p>}
      </div>
    </div>
  )
}
