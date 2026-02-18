import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLearningStore } from '../store'
import type { NarrationStyle } from '../store'
import { useProgressStore } from '../progress-store'
import { generateSyllabus } from '../api'

function makeId(title: string, layer: number) {
  return `${layer}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${Math.random().toString(36).slice(2, 6)}`
}

const STYLES: { value: NarrationStyle; label: string; desc: string; icon: string; gradient: string }[] = [
  { value: 'academic', label: 'Academic', desc: 'Formal & textbook-like', icon: '📚', gradient: 'from-indigo-500 to-blue-600' },
  { value: 'casual', label: 'Casual', desc: 'Conversational & friendly', icon: '💬', gradient: 'from-emerald-500 to-teal-600' },
  { value: 'eli5', label: 'ELI5', desc: 'Simple & fun', icon: '🧒', gradient: 'from-amber-400 to-orange-500' },
  { value: 'storytelling', label: 'Storytelling', desc: 'Narrative & analogies', icon: '📖', gradient: 'from-purple-500 to-pink-500' },
]

function LearningHistory() {
  const topics = useProgressStore(s => s.getAllTopics())
  const removeTopic = useProgressStore(s => s.removeTopic)

  if (topics.length === 0) return null

  return (
    <div className="mt-12 w-full max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '500ms' }}>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 text-left">📚 Your Learning History</h3>
      <div className="space-y-2">
        {topics.map(t => {
          const pct = t.totalNodes > 0 ? Math.round((t.visitedNodeIds.length / t.totalNodes) * 100) : 0
          const timeAgo = getTimeAgo(t.lastVisitedAt)
          return (
            <div key={t.rootTopic} className="flex items-center gap-3 bg-white/70 hover:bg-white rounded-xl px-4 py-3 border border-slate-200/60 hover:shadow-sm transition-all duration-200 group">
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-semibold text-slate-700 truncate">{t.rootTopic}</div>
                <div className="text-xs text-slate-400 mt-0.5">{timeAgo} · {t.narrationStyle}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
              </div>
              <button
                onClick={() => removeTopic(t.rootTopic)}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all duration-200 p-1"
                title="Remove"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

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
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50 animate-gradient" />
      
      {/* Decorative blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-200/30 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-200/30 blur-3xl" />
      <div className="absolute top-[30%] left-[20%] w-[200px] h-[200px] rounded-full bg-accent-400/10 blur-2xl" />

      <div className="relative z-10 text-center max-w-2xl px-4 animate-fade-in-up">
        {/* Logo */}
        <div className="mb-8">
          <span className="text-6xl animate-float inline-block">🎓</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mt-4 bg-gradient-to-r from-brand-700 via-brand-500 to-purple-500 bg-clip-text text-transparent font-display">
            Lumina
          </h1>
          <p className="text-slate-500 mt-3 text-base sm:text-lg">Your AI-powered learning companion</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-5 w-full max-w-xl mx-auto">
          {/* Search input */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-400 to-purple-400 rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition-all duration-500" />
            <div className="relative flex flex-col sm:flex-row bg-white rounded-2xl shadow-lg shadow-brand-100/50 border border-slate-200/80">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="What do you want to learn?"
                className="flex-1 px-5 sm:px-6 py-3.5 sm:py-4 rounded-t-2xl sm:rounded-t-none sm:rounded-l-2xl text-base sm:text-lg bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 sm:px-7 py-3.5 sm:py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-b-2xl sm:rounded-b-none sm:rounded-r-2xl text-base sm:text-lg font-semibold hover:from-brand-700 hover:to-brand-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    <span>Generating...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Explore</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Style selector */}
          <div>
            <p className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider">Narration Style</p>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 stagger-children">
              {STYLES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStyle(s.value)}
                  className={`group relative p-4 rounded-2xl text-left transition-all duration-300 overflow-hidden ${
                    style === s.value
                      ? 'bg-white shadow-lg shadow-brand-200/40 ring-2 ring-brand-400 scale-[1.02]'
                      : 'bg-white/60 hover:bg-white hover:shadow-md border border-slate-200/60 hover:scale-[1.01]'
                  }`}
                >
                  {style === s.value && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-[0.06]`} />
                  )}
                  <div className="relative">
                    <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform duration-300 inline-block">{s.icon}</div>
                    <div className="text-sm font-semibold text-slate-800">{s.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Example topics */}
        <div className="mt-10 flex flex-wrap justify-center gap-2 animate-fade-in" style={{ animationDelay: '400ms' }}>
          {['Quantum Physics', 'Machine Learning', 'Ancient Rome', 'Music Theory', 'Blockchain'].map(t => (
            <button
              key={t}
              onClick={() => setQuery(t)}
              className="px-4 py-1.5 text-sm text-slate-500 bg-white/50 hover:bg-white hover:text-brand-600 hover:shadow-sm rounded-full border border-slate-200/60 transition-all duration-200"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Learning History */}
        <LearningHistory />
      </div>
    </div>
  )
}
