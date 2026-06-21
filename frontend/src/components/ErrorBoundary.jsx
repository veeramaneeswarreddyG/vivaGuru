import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto px-6 text-center select-none">
          <div className="glass-premium p-8 rounded-vivaguru border border-danger/30 shadow-2xl flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center text-danger mb-4 animate-bounce">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
              Something went wrong
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              An unexpected rendering error occurred. We have caught it to protect your session data.
            </p>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-danger text-white rounded-xl text-xs font-semibold hover:bg-danger-dark shadow-lg shadow-danger/25 transition-all duration-200 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
