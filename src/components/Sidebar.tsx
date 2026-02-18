import { useState } from 'react'
import type { SyllabusNode } from '../store'

interface Props {
  nodes: SyllabusNode[]
  selectedId?: string
  loading: Record<string, boolean>
  onNodeClick: (node: SyllabusNode) => void
  depth?: number
}

function LayerDot({ layer }: { layer: number }) {
  const colors = [
    'bg-brand-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-purple-500',
  ]
  return (
    <span className={`w-1.5 h-1.5 rounded-full ${colors[layer] || colors[0]} flex-shrink-0 opacity-70`} />
  )
}

function SidebarItem({ node, selectedId, loading, onNodeClick, depth = 0 }: Props & { node: SyllabusNode; depth: number }) {
  const [expanded, setExpanded] = useState(true)
  const isSelected = node.id === selectedId
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      <div
        className={`group flex items-center gap-2 py-2 px-3 cursor-pointer rounded-xl text-sm transition-all duration-200 mx-2 my-0.5 ${
          isSelected
            ? 'bg-gradient-to-r from-brand-50 to-brand-100/50 text-brand-700 font-semibold shadow-sm border border-brand-200/50'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
        }`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => onNodeClick(node)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className="w-4 h-4 flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 4l8 6-8 6V4z"/>
            </svg>
          </button>
        ) : (
          <LayerDot layer={node.layer} />
        )}
        <span className="truncate">{node.title}</span>
        {loading[node.id] && (
          <div className="ml-auto flex-shrink-0">
            <svg className="animate-spin h-3.5 w-3.5 text-brand-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        )}
        {isSelected && !loading[node.id] && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
        )}
      </div>
      {hasChildren && expanded && (
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 border-l border-slate-200/60" style={{ marginLeft: `${depth * 16 + 22}px` }} />
          {node.children!.map(child => (
            <SidebarItem key={child.id} node={child} nodes={[]} selectedId={selectedId} loading={loading} onNodeClick={onNodeClick} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ nodes, selectedId, loading, onNodeClick }: Props) {
  return (
    <div className="py-3">
      {nodes.map(node => (
        <SidebarItem key={node.id} node={node} nodes={nodes} selectedId={selectedId} loading={loading} onNodeClick={onNodeClick} depth={0} />
      ))}
    </div>
  )
}
