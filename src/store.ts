import { create } from 'zustand'

export type NarrationStyle = 'academic' | 'casual' | 'eli5' | 'storytelling'

export interface SyllabusNode {
  id: string
  title: string
  description: string
  content?: string // markdown content with [[subtopic:Name]] markers
  children?: SyllabusNode[]
  layer: number
  parentPath: string[] // titles of ancestors
  image?: string // base64 image data (legacy)
  imageLoading?: boolean
  inlineImages?: Record<string, string> // key: image description, value: base64 data
  inlineImagesLoading?: Record<string, boolean>
}

interface LearningState {
  rootTopic: string
  narrationStyle: NarrationStyle
  tree: SyllabusNode[]
  loading: Record<string, boolean>
  error: Record<string, string>
  setRootTopic: (topic: string) => void
  setNarrationStyle: (style: NarrationStyle) => void
  setTree: (tree: SyllabusNode[]) => void
  setChildren: (nodeId: string, children: SyllabusNode[]) => void
  setContent: (nodeId: string, content: string) => void
  setLoading: (nodeId: string, loading: boolean) => void
  setError: (nodeId: string, error: string) => void
  setImage: (nodeId: string, image: string) => void
  setImageLoading: (nodeId: string, loading: boolean) => void
  setInlineImage: (nodeId: string, desc: string, image: string) => void
  setInlineImageLoading: (nodeId: string, desc: string, loading: boolean) => void
  findNode: (nodeId: string) => SyllabusNode | undefined
  reset: () => void
}

function findInTree(nodes: SyllabusNode[], id: string): SyllabusNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findInTree(node.children, id)
      if (found) return found
    }
  }
  return undefined
}

function updateInTree(nodes: SyllabusNode[], id: string, updater: (n: SyllabusNode) => SyllabusNode): SyllabusNode[] {
  return nodes.map(node => {
    if (node.id === id) return updater(node)
    if (node.children) return { ...node, children: updateInTree(node.children, id, updater) }
    return node
  })
}

export const useLearningStore = create<LearningState>((set, get) => ({
  rootTopic: '',
  narrationStyle: 'casual',
  tree: [],
  loading: {},
  error: {},
  setRootTopic: (topic) => set({ rootTopic: topic }),
  setNarrationStyle: (style) => set({ narrationStyle: style }),
  setTree: (tree) => set({ tree }),
  setChildren: (nodeId, children) => set(state => ({
    tree: updateInTree(state.tree, nodeId, n => ({ ...n, children }))
  })),
  setContent: (nodeId, content) => set(state => ({
    tree: updateInTree(state.tree, nodeId, n => ({ ...n, content }))
  })),
  setLoading: (nodeId, loading) => set(state => ({
    loading: { ...state.loading, [nodeId]: loading }
  })),
  setError: (nodeId, error) => set(state => ({
    error: { ...state.error, [nodeId]: error }
  })),
  setImage: (nodeId, image) => set(state => ({
    tree: updateInTree(state.tree, nodeId, n => ({ ...n, image, imageLoading: false }))
  })),
  setImageLoading: (nodeId, loading) => set(state => ({
    tree: updateInTree(state.tree, nodeId, n => ({ ...n, imageLoading: loading }))
  })),
  setInlineImage: (nodeId, desc, image) => set(state => ({
    tree: updateInTree(state.tree, nodeId, n => ({
      ...n,
      inlineImages: { ...(n.inlineImages || {}), [desc]: image },
      inlineImagesLoading: { ...(n.inlineImagesLoading || {}), [desc]: false },
    }))
  })),
  setInlineImageLoading: (nodeId, desc, loading) => set(state => ({
    tree: updateInTree(state.tree, nodeId, n => ({
      ...n,
      inlineImagesLoading: { ...(n.inlineImagesLoading || {}), [desc]: loading },
    }))
  })),
  findNode: (nodeId) => findInTree(get().tree, nodeId),
  reset: () => set({ rootTopic: '', tree: [], loading: {}, error: {} }),
}))
