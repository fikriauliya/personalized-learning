import React from 'react'
import type { SyllabusNode } from '../store'
import { estimateReadTime } from '../utils'
import Quiz from './Quiz'
import ExplainBack from './ExplainBack'

interface Props {
  node: SyllabusNode
  loading: boolean
  error?: string
  onChildClick: (node: SyllabusNode) => void
  onSubtopicClick: (title: string) => void
  rootTopic?: string
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="h-5 skeleton-shimmer rounded-lg w-3/4" />
      <div className="h-4 skeleton-shimmer rounded-lg w-full" />
      <div className="h-4 skeleton-shimmer rounded-lg w-5/6" />
      <div className="h-40 skeleton-shimmer rounded-2xl" />
      <div className="h-4 skeleton-shimmer rounded-lg w-full" />
      <div className="h-4 skeleton-shimmer rounded-lg w-2/3" />
      <div className="h-4 skeleton-shimmer rounded-lg w-4/5" />
    </div>
  )
}

function renderMarkdown(md: string): string {
  return md
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-100 p-5 rounded-2xl overflow-x-auto my-6 text-sm font-mono leading-relaxed shadow-lg"><code>$2</code></pre>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-8 mb-3 text-slate-800 flex items-center gap-2"><span class="w-1 h-5 bg-brand-400 rounded-full inline-block"></span>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-10 mb-4 text-slate-800 pb-2 border-b border-slate-100">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-10 mb-4 text-slate-800">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-800 font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-slate-600">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md text-sm font-mono border border-brand-100">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-5 list-none relative text-slate-700 before:content-[\'•\'] before:absolute before:-left-4 before:text-brand-400 before:font-bold">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-5 list-decimal text-slate-700 marker:text-brand-500 marker:font-semibold">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-slate-600 leading-[1.9] mb-4">')
}

function InlineImage({ desc, node }: { desc: string; node: SyllabusNode }) {
  const image = node.inlineImages?.[desc]
  const loading = node.inlineImagesLoading?.[desc]

  if (loading) {
    return (
      <div className="my-6 h-48 rounded-2xl flex flex-col items-center justify-center gap-3 skeleton-shimmer">
        <span className="text-2xl animate-float">🎨</span>
        <span className="text-slate-400 text-sm font-medium">Generating illustration...</span>
      </div>
    )
  }
  if (!image) return null
  return (
    <figure className="my-6 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-200/60 group">
      <img
        src={image}
        alt={desc}
        className="w-full max-h-[250px] sm:max-h-[350px] object-contain bg-gradient-to-br from-slate-50 to-white group-hover:scale-[1.01] transition-transform duration-500"
      />
      <figcaption className="px-4 py-2 text-xs text-slate-400 bg-slate-50 text-center italic">{desc}</figcaption>
    </figure>
  )
}

function ContentWithSubtopics({ content, node, onSubtopicClick }: { content: string; node: SyllabusNode; onSubtopicClick: (title: string) => void }) {
  const html = renderMarkdown(content)
  // Split on both subtopic and image markers
  const parts = html.split(/(\[\[subtopic:.*?\]\]|\[\[image:.*?\]\])/)

  const elements: React.ReactNode[] = []
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const subtopicMatch = part.match(/\[\[subtopic:(.*?)\]\]/)
    const imageMatch = part.match(/\[\[image:(.*?)\]\]/)

    if (subtopicMatch) {
      const title = subtopicMatch[1]
      elements.push(
        <button
          key={i}
          onClick={() => onSubtopicClick(title)}
          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 font-semibold transition-all duration-200 border-b-2 border-brand-200 hover:border-brand-500 pb-0.5 group"
        >
          <span>{title}</span>
          <svg className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )
    } else if (imageMatch) {
      const desc = imageMatch[1]
      elements.push(<InlineImage key={i} desc={desc} node={node} />)
    } else {
      elements.push(<span key={i} dangerouslySetInnerHTML={{ __html: part }} />)
    }
  }

  return <div className="prose-content max-w-none text-slate-600 leading-[1.9]">{elements}</div>
}

export default function ContentView({ node, loading, error, onChildClick: _, onSubtopicClick, rootTopic }: Props) {
  return (
    <div>
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 leading-tight font-display">
          {node.title}
        </h1>
        {node.content && (
          <p className="mt-2 text-sm text-slate-400 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {estimateReadTime(node.content)}
          </p>
        )}
      </div>

      {loading && <Skeleton />}

      {error && (
        <div className="px-5 py-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm animate-fade-in">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {node.content && (
        <div className="animate-fade-in-up">
          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/50 border border-slate-100 p-4 sm:p-6 md:p-8 lg:p-10">
            <ContentWithSubtopics content={node.content} node={node} onSubtopicClick={onSubtopicClick} />
          </div>

          {/* Engagement features */}
          {rootTopic && (
            <>
              <Quiz topic={node.title} content={node.content} nodeId={node.id} rootTopic={rootTopic} />
              <ExplainBack topic={node.title} content={node.content} nodeId={node.id} rootTopic={rootTopic} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
