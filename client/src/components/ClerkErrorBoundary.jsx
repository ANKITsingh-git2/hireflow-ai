import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ClerkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Clerk Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1
    }));
    // Force a full page reload to reinitialize Clerk
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-xl shadow-lg p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <AlertTriangle className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Authentication Service Unavailable
              </h1>
              <p className="text-muted-foreground">
                We're having trouble loading the authentication system. This might be due to a network issue or temporary service disruption.
              </p>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-left">
              <p className="font-semibold text-foreground mb-2">Troubleshooting steps:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Check your internet connection</li>
                <li>Disable any ad blockers or VPN</li>
                <li>Clear your browser cache</li>
                <li>Try a different browser</li>
              </ul>
            </div>

            <button
              onClick={this.handleRetry}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Loading
            </button>

            {this.state.retryCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Retry attempt: {this.state.retryCount}
              </p>
            )}

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                If the problem persists, please contact support or try again later.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ClerkErrorBoundary;
