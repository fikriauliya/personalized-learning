import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding: '2rem', fontFamily: 'monospace'}}>
          <h1 style={{color: 'red'}}>Something went wrong</h1>
          <pre style={{whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '1rem', borderRadius: '8px'}}>
            {this.state.error.message}{'\n'}{this.state.error.stack}
          </pre>
          <button onClick={() => { localStorage.clear(); window.location.reload() }} style={{marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer'}}>
            Clear Cache & Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
