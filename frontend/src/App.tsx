import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography, Button } from '@mui/material';
import { theme } from './theme';
import { StoreProvider } from './store/interviewStore';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { isAuthConfigured } from './auth';
import { AppShell } from './components/AppShell';
import DashboardPage from './pages/DashboardPage';
import NewInterviewPage from './pages/NewInterviewPage';
import InterviewWorkspacePage from './pages/InterviewWorkspacePage';
import ReportPage from './pages/ReportPage';
import LoginPage from './pages/LoginPage';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>Something went wrong</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {this.state.error.message}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>Reload</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthed, isLoading } = useAuth();
  if (!isAuthConfigured) return <>{children}</>;
  if (isLoading) return null;
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/"          element={<DashboardPage />} />
                <Route path="/new"       element={<NewInterviewPage />} />
                <Route path="/workspace" element={<InterviewWorkspacePage />} />
                <Route path="/report"    element={<ReportPage />} />
                <Route path="*"          element={
                  <Box sx={{ p: 6, textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom>Page not found</Typography>
                    <Button variant="contained" href="/">Go home</Button>
                  </Box>
                } />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <StoreProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </StoreProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
