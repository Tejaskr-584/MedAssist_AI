import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      
      try {
        // Check if it's a Firestore error JSON
        const parsed = JSON.parse(this.state.error?.message || '');
        if (parsed.error) {
          errorMessage = `Database Error: ${parsed.error}`;
        }
      } catch (e) {
        // Not a JSON error
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-300">
          <div className="max-w-md w-full bg-card rounded-[2.5rem] shadow-2xl border border-border p-10 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-rose-500/10 text-rose-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">Something went wrong</h2>
            <p className="text-muted-foreground mb-10 font-medium leading-relaxed">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-black py-5 px-6 rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-brand-primary/20 active:scale-95 text-xs uppercase tracking-widest"
            >
              <RefreshCcw size={20} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
