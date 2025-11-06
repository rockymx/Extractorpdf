import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('[DEBUG] ErrorBoundary: Error caught:', error);
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[DEBUG] ErrorBoundary: Component error details:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-red-900 border border-red-600 rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-4">Error de Aplicación</h1>
            <p className="mb-4">Lo siento, algo salió mal. Por favor, revisa la consola del navegador para más detalles.</p>

            {this.state.error && (
              <div className="bg-slate-800 p-4 rounded mb-4">
                <p className="font-mono text-sm text-red-300">{this.state.error.toString()}</p>
              </div>
            )}

            {this.state.errorInfo && (
              <details className="mb-4">
                <summary className="cursor-pointer font-semibold">Stack Trace</summary>
                <pre className="bg-slate-800 p-4 rounded mt-2 overflow-auto text-xs">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
