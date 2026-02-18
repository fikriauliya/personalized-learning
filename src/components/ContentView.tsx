import type { SyllabusNode } from '../store'

interface Props {
  node: SyllabusNode
  loading: boolean
  error?: string
  onChildClick: (node: SyllabusNode) => void
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-slate-200 rounded-xl" />
      ))}
    </div>
  )
}

function renderMarkdown(md: string) {
  // Basic markdown rendering
  const html = md
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-6 mb-2 text-slate-800">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold mt-8 mb-3 text-slate-800">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4 text-slate-800">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-blue-700">$1</code>')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto my-4 text-sm"><code>$2</code></pre>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-slate-700">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-slate-700">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-slate-700 leading-relaxed mb-3">')
  return `<p class="text-slate-700 leading-relaxed mb-3">${html}</p>`
}

export default function ContentView({ node, loading, error, onChildClick }: Props) {
  // Layer 4: show content
  if (node.layer === 4) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-4">{node.title}</h1>
        {loading && <Skeleton />}
        {error && <p className="text-red-500">{error}</p>}
        {node.content && (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(node.content) }} />
        )}
      </div>
    )
  }

  // Layers 1-3: show children or loading
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">{node.title}</h1>
      <p className="text-slate-500 mb-6">{node.description}</p>
      {loading && <Skeleton />}
      {error && <p className="text-red-500">{error}</p>}
      {node.children && (
        <div className="grid gap-3">
          {node.children.map(child => (
            <button
              key={child.id}
              onClick={() => onChildClick(child)}
              className="text-left p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition"
            >
              <h3 className="font-semibold text-slate-800">{child.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{child.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
