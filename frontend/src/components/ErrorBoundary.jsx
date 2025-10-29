// src/components/ErrorBoundary.jsx
import React from "react";
import { Box, Button, Typography } from "@mui/material";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
    this.setState({ info });
  }

  handleReload = () => {
    this.setState({ error: null, info: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="h5" color="error" sx={{ mb: 1 }}>
            Something went wrong
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {this.state.error?.message}
          </Typography>
          <Button variant="contained" onClick={this.handleReload}>
            Reload
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
