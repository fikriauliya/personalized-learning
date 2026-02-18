import { describe, it, expect, beforeEach } from 'vitest'
import { useLearningStore } from '../store'

describe('useLearningStore', () => {
  beforeEach(() => {
    useLearningStore.getState().reset()
  })

  it('has correct initial state', () => {
    const state = useLearningStore.getState()
    expect(state.rootTopic).toBe('')
    expect(state.narrationStyle).toBe('casual')
    expect(state.tree).toEqual([])
    expect(state.loading).toEqual({})
    expect(state.error).toEqual({})
  })

  it('setRootTopic updates rootTopic', () => {
    useLearningStore.getState().setRootTopic('Quantum Physics')
    expect(useLearningStore.getState().rootTopic).toBe('Quantum Physics')
  })

  it('setNarrationStyle updates narrationStyle', () => {
    useLearningStore.getState().setNarrationStyle('academic')
    expect(useLearningStore.getState().narrationStyle).toBe('academic')
  })

  it('setTree and findNode work', () => {
    const tree = [
      { id: 'root', title: 'Root', description: '', layer: 0, parentPath: [], children: [
        { id: 'child-1', title: 'Child 1', description: '', layer: 1, parentPath: ['Root'] }
      ]}
    ]
    useLearningStore.getState().setTree(tree)
    expect(useLearningStore.getState().tree).toHaveLength(1)
    expect(useLearningStore.getState().findNode('child-1')?.title).toBe('Child 1')
    expect(useLearningStore.getState().findNode('nonexistent')).toBeUndefined()
  })

  it('setContent updates node content', () => {
    useLearningStore.getState().setTree([
      { id: 'n1', title: 'Node', description: '', layer: 0, parentPath: [] }
    ])
    useLearningStore.getState().setContent('n1', '# Hello')
    expect(useLearningStore.getState().findNode('n1')?.content).toBe('# Hello')
  })

  it('setChildren updates node children', () => {
    useLearningStore.getState().setTree([
      { id: 'n1', title: 'Node', description: '', layer: 0, parentPath: [] }
    ])
    const children = [
      { id: 'c1', title: 'Child', description: '', layer: 1, parentPath: ['Node'] }
    ]
    useLearningStore.getState().setChildren('n1', children)
    expect(useLearningStore.getState().findNode('n1')?.children).toHaveLength(1)
    expect(useLearningStore.getState().findNode('c1')?.title).toBe('Child')
  })

  it('reset clears state', () => {
    useLearningStore.getState().setRootTopic('Test')
    useLearningStore.getState().setTree([{ id: 'x', title: 'X', description: '', layer: 0, parentPath: [] }])
    useLearningStore.getState().reset()
    expect(useLearningStore.getState().rootTopic).toBe('')
    expect(useLearningStore.getState().tree).toEqual([])
  })
})
