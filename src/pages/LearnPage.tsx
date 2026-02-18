import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLearningStore } from '../store'
import type { SyllabusNode } from '../store'
import { generateSyllabus, generateImage } from '../api'

import Sidebar from '../components/Sidebar'
import Breadcrumb from '../components/Breadcrumb'
import ContentView from '../components/ContentView'

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

export default function LearnPage() {
  const { nodeId } = useParams()
  const navigate = useNavigate()
  const store = useLearningStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (store.tree.length === 0) navigate('/')
  }, [store.tree, navigate])

  const selected = nodeId ? findNodeWithPath(store.tree, nodeId) : undefined

  // Generate image on page load for selected node
  useEffect(() => {
    if (!selected) return
    const node = selected.node
    if (node.image || node.imageLoading) return
    if (!node.content) return
    
    store.setImageLoading(node.id, true)
    const context = node.parentPath.join(' > ')
    generateImage(node.title, context)
      .then(img => store.setImage(node.id, img))
      .catch(() => store.setImageLoading(node.id, false))
  }, [selected?.node.id, selected?.node.content])

  async function handleNodeClick(node: SyllabusNode) {
    navigate(`/learn/${node.id}`)

    // If content already loaded, nothing to do
    if (node.content) return

    if (store.loading[node.id]) return
    store.setLoading(node.id, true)
    try {
      if (node.layer >= 3) {
        // Layer 4 (deepest): content only, no subtopics
        const data = await generateSyllabus(node.title, 4, store.rootTopic, node.parentPath, store.narrationStyle)
        store.setContent(node.id, data.content)
      } else {
        // Layers 0-2: content with inline subtopic links
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

  // Find child node by title (for inline subtopic links)
  function handleSubtopicClick(subtopicTitle: string) {
    if (!selected) return
    const node = selected.node
    const child = node.children?.find(c => c.title === subtopicTitle)
    if (child) {
      handleNodeClick(child)
    }
  }

  const breadcrumbPath = selected
    ? [{ title: store.rootTopic, id: selected.path[0]?.id || '' }, ...selected.path.map(n => ({ title: n.title, id: n.id }))]
    : [{ title: store.rootTopic, id: '' }]

  return (
    <div className="min-h-screen flex bg-slate-50">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden bg-white p-2 rounded-lg shadow-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      <div className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 overflow-y-auto transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-4 border-b border-slate-200">
          <Link to="/" className="text-lg font-semibold text-blue-600 hover:text-blue-700">🎓 New Topic</Link>
        </div>
        <Sidebar
          nodes={store.tree}
          selectedId={nodeId}
          loading={store.loading}
          onNodeClick={(node) => { handleNodeClick(node); setSidebarOpen(false) }}
        />
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto p-4 lg:p-8 pt-14 lg:pt-8">
          <Breadcrumb items={breadcrumbPath} onNavigate={(id) => id ? navigate(`/learn/${id}`) : navigate('/learn')} />

          {selected ? (
            <ContentView
              node={selected.node}
              loading={!!store.loading[selected.node.id]}
              error={store.error[selected.node.id]}
              onChildClick={handleNodeClick}
              onSubtopicClick={handleSubtopicClick}
            />
          ) : (
            <p className="text-slate-500">Select a topic from the sidebar</p>
          )}
        </div>
      </div>
    </div>
  )
}
