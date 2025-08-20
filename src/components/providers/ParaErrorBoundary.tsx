import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "../ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ParaErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Para Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Track Para-specific errors
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
        custom_parameter_1: 'para_error',
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isParaError = this.state.error?.message?.toLowerCase().includes('para') ||
                         this.state.error?.stack?.toLowerCase().includes('@getpara');

      return (
        <div className="min-h-screen bg-[#F9F5F1] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-[#8B6F47] mb-2">
                {isParaError ? 'Email Authentication Error' : 'Something went wrong'}
              </h1>
              <p className="text-gray-600 text-sm mb-6">
                {isParaError 
                  ? 'There was an issue with email authentication. Please try refreshing the page or contact support if the issue persists.'
                  : 'An unexpected error occurred. Please refresh the page to continue.'
                }
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={this.handleReload}
                className="w-full bg-[#8B6F47] text-white hover:bg-[#725A3A]"
              >
                Refresh Page
              </Button>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Show Error Details
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                If this error persists, please{' '}
                <a 
                  href="mailto:support@kurifinance.com" 
                  className="text-[#8B6F47] hover:underline"
                >
                  contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}