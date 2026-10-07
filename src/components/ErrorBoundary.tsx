import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };
  private readonly children: ReactNode;

  public constructor(props: Props) {
    super(props);
    this.children = props.children;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught application error:', error, errorInfo);
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#1a1a1a] p-8 text-white">
          <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/40 bg-black/30 p-6">
            <h2 className="text-xl font-semibold">Something went wrong loading this view.</h2>
            <p className="mt-2 text-sm text-slate-300">
              Refresh the page and try again. If the problem continues, check the browser console for details.
            </p>
            <pre className="mt-5 overflow-auto rounded-lg bg-black/40 p-4 text-xs text-red-300">
              {this.state.error?.toString()}
            </pre>
          </div>
        </div>
      );
    }

    return this.children;
  }
}
