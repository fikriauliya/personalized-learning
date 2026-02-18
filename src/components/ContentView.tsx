import React from 'react'
import type { SyllabusNode } from '../store'

interface Props {
  node: SyllabusNode
  loading: boolean
  error?: string
  onChildClick: (node: SyllabusNode) => void
  onSubtopicClick: (title: string) => void
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="h-4 bg-slate-200 rounded w-full" />
      <div className="h-4 bg-slate-200 rounded w-5/6" />
      <div className="h-24 bg-slate-200 rounded" />
      <div className="h-4 bg-slate-200 rounded w-full" />
      <div className="h-4 bg-slate-200 rounded w-2/3" />
    </div>
  )
}

function renderMarkdown(md: string): string {
  return md
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto my-4 text-sm"><code>$2</code></pre>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-6 mb-2 text-slate-800">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold mt-8 mb-3 text-slate-800">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4 text-slate-800">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-blue-700">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-slate-700">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-slate-700">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-slate-700 leading-relaxed mb-3">')
}

// Parse content and replace [[subtopic:Name]] with clickable elements
function ContentWithSubtopics({ content, node, onSubtopicClick }: { content: string; node: SyllabusNode; onSubtopicClick: (title: string) => void }) {
  // First render markdown to HTML
  const html = renderMarkdown(content)
  
  // Split by subtopic markers
  const parts = html.split(/\[\[subtopic:(.*?)\]\]/)
  
  // parts: [text, subtopicName, text, subtopicName, ...]
  const elements: React.ReactNode[] = []
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Regular HTML content
      elements.push(
        <span key={i} dangerouslySetInnerHTML={{ __html: parts[i] }} />
      )
    } else {
      // Subtopic link
      const title = parts[i]
      const child = node.children?.find(c => c.title === title)
      elements.push(
        <button
          key={i}
          onClick={() => onSubtopicClick(title)}
          className="inline text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-600 font-medium transition cursor-pointer"
          title={child ? `Explore: ${title}` : title}
        >
          {title} →
        </button>
      )
    }
  }

  return <div className="prose max-w-none text-slate-700 leading-relaxed">{elements}</div>
}

export default function ContentView({ node, loading, error, onChildClick: _, onSubtopicClick }: Props) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-4">{node.title}</h1>
      
      {loading && <Skeleton />}
      {error && <p className="text-red-500">{error}</p>}
      
      {node.content && (
        <>
          {/* AI-generated image */}
          {node.image && (
            <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <img src={node.image} alt={`Illustration: ${node.title}`} className="w-full max-h-96 object-contain bg-white" />
            </div>
          )}
          {node.imageLoading && (
            <div className="mb-6 h-48 bg-slate-100 rounded-xl flex items-center justify-center animate-pulse">
              <span className="text-slate-400 text-sm">🎨 Generating illustration...</span>
            </div>
          )}
          
          <ContentWithSubtopics content={node.content} node={node} onSubtopicClick={onSubtopicClick} />
        </>
      )}
    </div>
  )
}
