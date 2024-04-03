import React from "react";

import { ReactErrorFallback } from "src/errorFallbackScreens/types";

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback: ReactErrorFallback;
}

interface ErrorBoundaryState {
    hasError: boolean;

    error?: unknown;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: undefined };
    }

    componentDidCatch(error: unknown): void {
        console.error({ error });

        this.setState({ hasError: true, error });
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            const Fallback = this.props.fallback;

            return <Fallback error={this.state.error} />;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;