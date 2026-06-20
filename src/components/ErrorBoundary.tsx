import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
          <div className="bg-slate-800 p-8 rounded-2xl border border-red-500/50 shadow-2xl max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Ocorreu um erro inesperado</h1>
            <p className="text-slate-300 mb-4">
              Desculpe, algo deu errado. Por favor, tire um print desta tela e envie para o suporte.
            </p>
            <div className="bg-black/50 p-4 rounded-xl overflow-auto text-sm font-mono text-red-300 mb-4 max-h-64">
              {this.state.error?.toString()}
              <br /><br />
              {this.state.error?.stack}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
