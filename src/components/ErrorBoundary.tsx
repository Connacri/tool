import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AutoPost Studio Uncaught React Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  private handleSoftReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold font-['Syne'] text-white">
                AutoPost Studio
              </h1>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Une erreur est survenue lors de l'affichage de l'application. Vos créations peuvent être restaurées immédiatement.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-left font-mono text-[11px] text-red-400 overflow-x-auto max-h-36 custom-scrollbar">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleSoftReload}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Réessayer</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Réinitialiser les données</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
