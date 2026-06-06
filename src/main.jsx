import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at top left, #f0e6ff 0%, #fdf8ff 40%, #e8f4fd 100%)',
          fontFamily: 'Nunito, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌸</div>
          <h1 style={{ color: '#1E1B4B', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#6B7280', marginBottom: '1.5rem', maxWidth: '400px' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              padding: '12px 28px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Reload App
          </button>
          <details style={{ marginTop: '1.5rem', maxWidth: '500px', textAlign: 'left' }}>
            <summary style={{ color: '#6B7280', cursor: 'pointer', fontSize: '0.8rem' }}>
              Technical details
            </summary>
            <pre style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
