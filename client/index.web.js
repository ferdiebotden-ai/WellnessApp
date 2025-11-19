import React from 'react';
import { AppRegistry } from 'react-native';
import App from './src/App';

// Add error boundary for web
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#fff', backgroundColor: '#0F1218', minHeight: '100vh' }}>
          <h1 style={{ color: '#FF5A5F' }}>Something went wrong</h1>
          <pre style={{ color: '#A7B4C7' }}>{this.state.error?.toString()}</pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#63E6BE',
              color: '#0F1218',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap App with error boundary
const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Register the app
AppRegistry.registerComponent('main', () => AppWithErrorBoundary);

// For web, we need to start the app manually
if (typeof window !== 'undefined') {
  AppRegistry.runApplication('main', {
    initialProps: {},
    rootTag: document.getElementById('root') || document.getElementById('app-root'),
  });
}

