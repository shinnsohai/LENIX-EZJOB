import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public override state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    constructor(props: Props) {
        super(props);
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    // Soft reset: clear the boundary's error state so children remount and
    // retry, without a full page reload.
    handleTryAgain = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            const isDev = import.meta.env.DEV;
            return (
                <div className="min-h-screen flex flex-col justify-center items-center bg-red-50 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-xl max-w-2xl w-full border border-red-200">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong.</h1>
                        <p className="text-slate-600 mb-4">
                            {isDev
                                ? 'The application crashed with the following error:'
                                : "We're sorry, an unexpected error occurred. You can try again, or reload the page if the problem persists."}
                        </p>
                        {isDev && (
                            <div className="bg-slate-900 text-red-300 p-4 rounded-lg overflow-auto text-sm font-mono mb-6 max-h-64">
                                {this.state.error && this.state.error.toString()}
                                <br />
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={this.handleTryAgain}
                                className="px-6 py-2 bg-slate-100 text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
