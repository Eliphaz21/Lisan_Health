import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorId: string;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorId: '' };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true, errorId: crypto.randomUUID() };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[LisanHealth UI Error]', { errorId: this.state.errorId, name: error.name, message: error.message, componentStack: info.componentStack });
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="container error-page" role="alert">
        <div className="card error-page__card">
          <p className="error-page__code">Something went wrong</p>
          <h1>We could not display this page.</h1>
          <p>Refresh the page and try again. Your report data was not included in this error message.</p>
          <p className="error-page__id">Reference: {this.state.errorId}</p>
          <button className="btn-primary" type="button" onClick={() => window.location.reload()}>Refresh page</button>
        </div>
      </main>
    );
  }
}
