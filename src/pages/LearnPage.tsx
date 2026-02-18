import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLearningStore } from '../store'
import type { SyllabusNode } from '../store'
import { useProgressStore } from '../progress-store'
import { generateSyllabus, generateImage } from '../api'

import Sidebar from '../components/Sidebar'
import Breadcrumb from '../components/Breadcrumb'
import ContentView from '../components/ContentView'
import KnowledgeMap from '../components/KnowledgeMap'

function makeId(title: string, layer: number) {
  return `${layer}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${Math.random().toString(36).slice(2, 6)}`
}

function findNodeWithPath(nodes: SyllabusNode[], id: string, path: SyllabusNode[] = []): { node: SyllabusNode; path: SyllabusNode[] } | undefined {
  for (const n of nodes) {
    if (n.id === id) return { node: n, path: [...path, n] }
    if (n.children) {
      const found = findNodeWithPath(n.children, id, [...path, n])
      if (found) return found
    }
  }
  return undefined
}

function ProgressBar({ rootTopic }: { rootTopic: string }) {
  const progress = useProgressStore(s => s.topics[rootTopic])
  if (!progress || progress.totalNodes === 0) return null
  const pct = Math.round((progress.visitedNodeIds.length / progress.totalNodes) * 100)
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
        {progress.visitedNodeIds.length}/{progress.totalNodes} explored
      </span>
    </div>
  )
}

export default function LearnPage() {
  const { nodeId } = useParams()
  const navigate = useNavigate()
  const store = useLearningStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'tree' | 'map'>('tree')
  const markVisited = useProgressStore(s => s.markVisited)

  useEffect(() => {
    if (store.tree.length === 0) navigate('/')
  }, [store.tree, navigate])

  const selected = nodeId ? findNodeWithPath(store.tree, nodeId) : undefined

  // Track progress
  useEffect(() => {
    if (!selected?.node?.content || !store.rootTopic) return
    const countNodes = (nodes: SyllabusNode[]): number =>
      nodes.reduce((sum, n) => sum + 1 + (n.children ? countNodes(n.children) : 0), 0)
    markVisited(store.rootTopic, selected.node.id, countNodes(store.tree), store.narrationStyle)
  }, [selected?.node.id, selected?.node.content])

  // Generate inline images on page load
  useEffect(() => {
    if (!selected) return
    const node = selected.node
    if (!node.content) return
    // Find all [[image:description]] markers
    const imageRegex = /\[\[image:(.*?)\]\]/g
    let match
    while ((match = imageRegex.exec(node.content)) !== null) {
      const desc = match[1]
      // Skip if already loaded or loading
      if (node.inlineImages?.[desc]) continue
      if (node.inlineImagesLoading?.[desc]) continue
      store.setInlineImageLoading(node.id, desc, true)
      const context = [...node.parentPath, node.title].join(' > ')
      generateImage(desc, context)
        .then(img => store.setInlineImage(node.id, desc, img))
        .catch(() => store.setInlineImageLoading(node.id, desc, false))
    }
  }, [selected?.node.id, selected?.node.content])

  async function handleNodeClick(node: SyllabusNode) {
    navigate(`/learn/${node.id}`)
    if (store.loading[node.id]) return
    store.setLoading(node.id, true)
    try {
      if (node.layer >= 3) {
        const data = await generateSyllabus(node.title, 4, store.rootTopic, node.parentPath, store.narrationStyle)
        store.setContent(node.id, data.content)
      } else {
        const nextLayer = node.layer + 1
        const data = await generateSyllabus(node.title, nextLayer, store.rootTopic, [...node.parentPath, node.title], store.narrationStyle)
        store.setContent(node.id, data.content)
        const children = (data.subtopics || []).map((st: string) => ({
          id: makeId(st, nextLayer),
          title: st,
          description: '',
          layer: nextLayer,
          parentPath: [...node.parentPath, node.title],
        }))
        store.setChildren(node.id, children)
      }
    } catch (err: any) {
      store.setError(node.id, err.message)
    } finally {
      store.setLoading(node.id, false)
    }
  }

  function handleSubtopicClick(subtopicTitle: string) {
    if (!selected) return
    const child = selected.node.children?.find(c => c.title === subtopicTitle)
    if (child) handleNodeClick(child)
  }

  const breadcrumbPath = selected
    ? [{ title: store.rootTopic, id: selected.path[0]?.id || '' }, ...selected.path.map(n => ({ title: n.title, id: n.id }))]
    : [{ title: store.rootTopic, id: '' }]

  return (
    <div className="min-h-screen flex bg-surface-dim">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden glass p-2.5 rounded-xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 active:scale-95"
      >
        <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-40 w-[85vw] max-w-80 bg-white/95 backdrop-blur-xl border-r border-slate-200/60 overflow-y-auto transition-all duration-500 ease-out ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'} lg:translate-x-0 lg:shadow-none`}>
        <div className="p-5 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="text-xl group-hover:scale-110 transition-transform duration-300">🎓</span>
            <span className="text-lg font-bold bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent font-display">Lumina</span>
          </Link>
          <div className="flex mt-3 bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('tree')}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${viewMode === 'tree' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              🌳 Tree
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              🗺️ Map
            </button>
          </div>
        </div>
        {viewMode === 'tree' ? (
          <Sidebar
            nodes={store.tree}
            selectedId={nodeId}
            loading={store.loading}
            onNodeClick={(node) => { handleNodeClick(node); setSidebarOpen(false) }}
          />
        ) : (
          <KnowledgeMap
            nodes={store.tree}
            selectedId={nodeId}
            loading={store.loading}
            onNodeClick={(node) => { handleNodeClick(node); setSidebarOpen(false) }}
            rootTopic={store.rootTopic}
          />
        )}
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-5 lg:px-10 py-4 sm:py-6 lg:py-10 pt-14 sm:pt-16 lg:pt-10">
          <Breadcrumb items={breadcrumbPath} onNavigate={(id) => id ? navigate(`/learn/${id}`) : navigate('/learn')} />
          <ProgressBar rootTopic={store.rootTopic} />

          <div className="animate-fade-in-up">
            {selected ? (
              <ContentView
                node={selected.node}
                loading={!!store.loading[selected.node.id]}
                error={store.error[selected.node.id]}
                onChildClick={handleNodeClick}
                onSubtopicClick={handleSubtopicClick}
                rootTopic={store.rootTopic}
              />
            ) : (
              <div className="text-center py-20 text-slate-400">
                <span className="text-4xl mb-4 block">📖</span>
                <p>Select a topic from the sidebar to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
