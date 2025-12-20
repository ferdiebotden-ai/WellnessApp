import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { palette } from '../theme/palette';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Name for debugging purposes */
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs the error, and displays a fallback UI instead of crashing.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary name="HomeScreen" onError={logToService}>
 *   <HomeScreen />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log the error
    console.error(
      `[ErrorBoundary${this.props.name ? `:${this.props.name}` : ''}] Caught error:`,
      error,
      errorInfo
    );

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>⚠️</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.props.name
                ? `An error occurred in ${this.props.name}.`
                : 'An unexpected error occurred.'}
            </Text>

            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo?.componentStack && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Minimal error boundary for sections that can fail gracefully
 * Shows nothing on error (useful for optional UI elements)
 */
export class SilentErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.warn('[SilentErrorBoundary] Suppressed error:', error.message);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.canvas,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  content: {
    alignItems: 'center',
    maxWidth: 320,
  },

  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },

  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: palette.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },

  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },

  retryButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },

  retryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: palette.canvas,
  },

  debugContainer: {
    marginTop: 24,
    maxHeight: 200,
    width: '100%',
    backgroundColor: palette.surface,
    borderRadius: 8,
    padding: 12,
  },

  debugTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 8,
  },

  debugText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: palette.textTertiary,
    lineHeight: 14,
  },
});

export default ErrorBoundary;
