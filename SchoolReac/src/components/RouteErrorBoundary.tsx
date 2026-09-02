// components/RouteErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button } from "@mui/material";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Route error:", error, info);
    // Optionally report to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" color="error">
            Something went wrong
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
            {this.state.error?.message}
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', textAlign: 'left', overflow: 'auto', maxHeight: 400 }}>
            <pre style={{ fontSize: '0.8rem' }}>{this.state.error?.stack}</pre>
          </Box>
          <Button onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            Reload Page
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
