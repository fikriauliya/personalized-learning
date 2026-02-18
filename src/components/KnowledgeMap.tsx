import { useEffect, useRef, useState, useCallback } from 'react'
import type { SyllabusNode } from '../store'
import { useProgressStore } from '../progress-store'

interface Props {
  nodes: SyllabusNode[]
  selectedId?: string
  loading: Record<string, boolean>
  onNodeClick: (node: SyllabusNode) => void
  rootTopic: string
}

interface GraphNode {
  id: string
  title: string
  x: number
  y: number
  depth: number
  syllabusNode: SyllabusNode
}

interface GraphEdge {
  from: string
  to: string
}

function flattenTree(nodes: SyllabusNode[], depth: number = 0): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const graphNodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  function walk(items: SyllabusNode[], d: number) {
    for (const node of items) {
      graphNodes.push({ id: node.id, title: node.title, x: 0, y: 0, depth: d, syllabusNode: node })
      if (node.children) {
        for (const child of node.children) {
          edges.push({ from: node.id, to: child.id })
        }
        walk(node.children, d + 1)
      }
    }
  }
  walk(nodes, depth)
  return { nodes: graphNodes, edges }
}

function layoutTree(graphNodes: GraphNode[], edges: GraphEdge[], width: number, height: number) {
  // Group by depth
  const byDepth = new Map<number, GraphNode[]>()
  for (const n of graphNodes) {
    const list = byDepth.get(n.depth) || []
    list.push(n)
    byDepth.set(n.depth, list)
  }

  const maxDepth = Math.max(...Array.from(byDepth.keys()), 0)
  const yStep = maxDepth > 0 ? (height - 100) / maxDepth : 0

  for (const [depth, nodes] of byDepth) {
    const xStep = width / (nodes.length + 1)
    nodes.forEach((n, i) => {
      n.x = xStep * (i + 1)
      n.y = 50 + depth * yStep
    })
  }

  // If parent has children, center parent over children
  void edges // layout is already decent for tree
}

export default function KnowledgeMap({ nodes, selectedId, loading, onNodeClick, rootTopic }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 })
  const progress = useProgressStore(s => s.topics[rootTopic])
  const visitedIds = new Set(progress?.visitedNodeIds || [])

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect()
      setDimensions({ width: Math.max(width, 300), height: Math.max(height, 300) })
    }
  }, [])

  useEffect(() => {
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [updateDimensions])

  const { nodes: graphNodes, edges } = flattenTree(nodes)
  layoutTree(graphNodes, edges, dimensions.width, dimensions.height)

  const nodeMap = new Map(graphNodes.map(n => [n.id, n]))

  const nodeRadius = (depth: number) => Math.max(24 - depth * 4, 10)

  return (
    <div ref={containerRef} className="w-full h-full min-h-[300px]" style={{ height: `${Math.max(graphNodes.length * 30, 300)}px` }}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={Math.max(graphNodes.length * 30, 300)}
        className="w-full"
      >
        {/* Edges */}
        {edges.map(e => {
          const from = nodeMap.get(e.from)
          const to = nodeMap.get(e.to)
          if (!from || !to) return null
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#cbd5e1"
              strokeWidth={1.5}
              opacity={0.6}
            />
          )
        })}

        {/* Nodes */}
        {graphNodes.map(n => {
          const r = nodeRadius(n.depth)
          const isSelected = n.id === selectedId
          const isVisited = visitedIds.has(n.id)
          const isLoading = loading[n.id]
          const fill = isSelected ? '#4c6ef5' : isVisited ? '#748ffc' : '#e2e8f0'
          const textColor = isSelected || isVisited ? '#fff' : '#64748b'

          return (
            <g
              key={n.id}
              onClick={() => onNodeClick(n.syllabusNode)}
              className="cursor-pointer"
              style={{ transition: 'transform 0.2s' }}
            >
              {isSelected && (
                <circle cx={n.x} cy={n.y} r={r + 4} fill="none" stroke="#4c6ef5" strokeWidth={2} opacity={0.3}>
                  <animate attributeName="r" from={r + 4} to={r + 8} dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill={fill}
                stroke={isSelected ? '#3b5bdb' : isVisited ? '#5c7cfa' : '#cbd5e1'}
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
              {isLoading && (
                <circle cx={n.x} cy={n.y} r={r} fill="none" stroke="#4c6ef5" strokeWidth={2} strokeDasharray="8 4" opacity={0.6}>
                  <animateTransform attributeName="transform" type="rotate" from={`0 ${n.x} ${n.y}`} to={`360 ${n.x} ${n.y}`} dur="1s" repeatCount="indefinite" />
                </circle>
              )}
              <text
                x={n.x}
                y={n.y + r + 14}
                textAnchor="middle"
                className="text-[10px] font-medium select-none pointer-events-none"
                fill="#475569"
              >
                {n.title.length > 18 ? n.title.slice(0, 16) + '…' : n.title}
              </text>
              {r >= 14 && (
                <text
                  x={n.x}
                  y={n.y + 4}
                  textAnchor="middle"
                  className="text-[9px] font-semibold select-none pointer-events-none"
                  fill={textColor}
                >
                  {n.title.length > 6 ? n.title.slice(0, 5) + '…' : n.title}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
