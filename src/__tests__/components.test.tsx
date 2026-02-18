import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import ContentView from '../components/ContentView'
import Breadcrumb from '../components/Breadcrumb'
import type { SyllabusNode } from '../store'

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('Sidebar', () => {
  it('renders tree structure', () => {
    const nodes: SyllabusNode[] = [
      { id: 'root', title: 'Root Topic', description: '', layer: 0, parentPath: [], children: [
        { id: 'c1', title: 'Child One', description: '', layer: 1, parentPath: ['Root Topic'] }
      ]}
    ]
    renderWithRouter(<Sidebar nodes={nodes} loading={{}} onNodeClick={() => {}} />)
    expect(screen.getByText('Root Topic')).toBeInTheDocument()
    expect(screen.getByText('Child One')).toBeInTheDocument()
  })
})

describe('ContentView', () => {
  it('renders content with subtopic links', () => {
    const node: SyllabusNode = {
      id: 'n1', title: 'Test Node', description: '', layer: 1, parentPath: [],
      content: 'Learn about [[subtopic:Quantum Physics]] and more',
    }
    render(<ContentView node={node} loading={false} onChildClick={() => {}} onSubtopicClick={() => {}} />)
    expect(screen.getByText('Test Node')).toBeInTheDocument()
    expect(screen.getByText('Quantum Physics')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    const node: SyllabusNode = { id: 'n1', title: 'Loading', description: '', layer: 0, parentPath: [] }
    const { container } = render(<ContentView node={node} loading={true} onChildClick={() => {}} onSubtopicClick={() => {}} />)
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBeGreaterThan(0)
  })

  it('shows error message', () => {
    const node: SyllabusNode = { id: 'n1', title: 'Error', description: '', layer: 0, parentPath: [] }
    render(<ContentView node={node} loading={false} error="Something went wrong" onChildClick={() => {}} onSubtopicClick={() => {}} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})

describe('Breadcrumb', () => {
  it('renders breadcrumb items', () => {
    const items = [
      { title: 'Home', id: 'home' },
      { title: 'Topic', id: 'topic' },
      { title: 'Current', id: 'current' },
    ]
    render(<Breadcrumb items={items} onNavigate={() => {}} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Topic')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
  })
})
