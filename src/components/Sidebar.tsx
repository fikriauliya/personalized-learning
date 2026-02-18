import { useState } from 'react'
import type { SyllabusNode } from '../store'

interface Props {
  nodes: SyllabusNode[]
  selectedId?: string
  loading: Record<string, boolean>
  onNodeClick: (node: SyllabusNode) => void
  depth?: number
}

function SidebarItem({ node, selectedId, loading, onNodeClick, depth = 0 }: Props & { node: SyllabusNode; depth: number }) {
  const [expanded, setExpanded] = useState(true)
  const isSelected = node.id === selectedId
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1.5 px-2 cursor-pointer rounded text-sm hover:bg-blue-50 transition ${isSelected ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-700'}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onNodeClick(node)}
      >
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className="w-4 h-4 flex-shrink-0 text-slate-400 hover:text-slate-600"
          >
            <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 4l8 6-8 6V4z"/>
            </svg>
          </button>
        )}
        {!hasChildren && <span className="w-4 flex-shrink-0" />}
        <span className="truncate">{node.title}</span>
        {loading[node.id] && (
          <svg className="animate-spin h-3 w-3 text-blue-500 ml-auto flex-shrink-0" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
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
    <div className="py-2">
      {nodes.map(node => (
        <SidebarItem key={node.id} node={node} nodes={nodes} selectedId={selectedId} loading={loading} onNodeClick={onNodeClick} depth={0} />
      ))}
    </div>
  )
}
