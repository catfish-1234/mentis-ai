/**
 * @module index
 *
 * Application entry point. Mounts the React component tree into the DOM,
 * wrapped in `React.StrictMode` and a top-level `ErrorBoundary` for
 * graceful runtime error handling.
 *
 * Imports the Inter font and global CSS styles.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import './src/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

/** Props accepted by the {@link ErrorBoundary} component. */
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

/** Internal state for the {@link ErrorBoundary} component. */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary that catches unhandled exceptions in the React
 * component tree and renders a fallback UI instead of a blank screen.
 *
 * Logs full error details (including React `ErrorInfo`) to the console.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);