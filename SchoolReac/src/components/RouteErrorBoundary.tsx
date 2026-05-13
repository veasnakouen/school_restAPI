// components/RouteErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button } from "@mui/material";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
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
          <Button onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            Reload Page
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
