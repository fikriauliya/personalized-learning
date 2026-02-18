import { create } from 'zustand'

export interface QuizResult {
  nodeId: string
  score: number
  total: number
  completedAt: string
}

export interface ExplainBackResult {
  nodeId: string
  score: number
  completedAt: string
}

export interface TopicProgress {
  rootTopic: string
  narrationStyle: string
  visitedNodeIds: string[] // ordered list of visited node IDs
  totalNodes: number
  startedAt: string
  lastVisitedAt: string
  quizResults?: Record<string, QuizResult> // keyed by nodeId
  explainBackResults?: Record<string, ExplainBackResult> // keyed by nodeId
}

interface ProgressState {
  topics: Record<string, TopicProgress> // key: rootTopic
  markVisited: (rootTopic: string, nodeId: string, totalNodes: number, narrationStyle: string) => void
  saveQuizResult: (rootTopic: string, nodeId: string, score: number, total: number) => void
  saveExplainBackResult: (rootTopic: string, nodeId: string, score: number) => void
  getQuizResult: (rootTopic: string, nodeId: string) => QuizResult | undefined
  getExplainBackResult: (rootTopic: string, nodeId: string) => ExplainBackResult | undefined
  getProgress: (rootTopic: string) => TopicProgress | undefined
  getAllTopics: () => TopicProgress[]
  removeTopic: (rootTopic: string) => void
  clearAll: () => void
}

const STORAGE_KEY = 'lumina-progress'

function loadFromStorage(): Record<string, TopicProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage(topics: Record<string, TopicProgress>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topics))
  } catch {
    // localStorage full or unavailable
  }
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  topics: loadFromStorage(),

  markVisited: (rootTopic, nodeId, totalNodes, narrationStyle) => set(state => {
    const existing = state.topics[rootTopic]
    const now = new Date().toISOString()
    const visited = existing?.visitedNodeIds || []
    const updated = {
      ...state.topics,
      [rootTopic]: {
        rootTopic,
        narrationStyle: existing?.narrationStyle || narrationStyle,
        visitedNodeIds: visited.includes(nodeId) ? visited : [...visited, nodeId],
        totalNodes: Math.max(totalNodes, existing?.totalNodes || 0),
        startedAt: existing?.startedAt || now,
        lastVisitedAt: now,
      },
    }
    saveToStorage(updated)
    return { topics: updated }
  }),

  saveQuizResult: (rootTopic, nodeId, score, total) => set(state => {
    const existing = state.topics[rootTopic]
    if (!existing) return state
    const updated = {
      ...state.topics,
      [rootTopic]: {
        ...existing,
        quizResults: {
          ...(existing.quizResults || {}),
          [nodeId]: { nodeId, score, total, completedAt: new Date().toISOString() },
        },
      },
    }
    saveToStorage(updated)
    return { topics: updated }
  }),

  saveExplainBackResult: (rootTopic, nodeId, score) => set(state => {
    const existing = state.topics[rootTopic]
    if (!existing) return state
    const updated = {
      ...state.topics,
      [rootTopic]: {
        ...existing,
        explainBackResults: {
          ...(existing.explainBackResults || {}),
          [nodeId]: { nodeId, score, completedAt: new Date().toISOString() },
        },
      },
    }
    saveToStorage(updated)
    return { topics: updated }
  }),

  getQuizResult: (rootTopic, nodeId) => get().topics[rootTopic]?.quizResults?.[nodeId],

  getExplainBackResult: (rootTopic, nodeId) => get().topics[rootTopic]?.explainBackResults?.[nodeId],

  getProgress: (rootTopic) => get().topics[rootTopic],

  getAllTopics: () => Object.values(get().topics).sort(
    (a, b) => new Date(b.lastVisitedAt).getTime() - new Date(a.lastVisitedAt).getTime()
  ),

  removeTopic: (rootTopic) => set(state => {
    const { [rootTopic]: _, ...rest } = state.topics
    saveToStorage(rest)
    return { topics: rest }
  }),

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ topics: {} })
  },
}))
