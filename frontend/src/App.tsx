import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import { StoreProvider } from './store/interviewStore';
import { AppShell } from './components/AppShell';
import DashboardPage from './pages/DashboardPage';
import NewInterviewPage from './pages/NewInterviewPage';
import InterviewWorkspacePage from './pages/InterviewWorkspacePage';
import ReportPage from './pages/ReportPage';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StoreProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/"          element={<DashboardPage />} />
              <Route path="/new"       element={<NewInterviewPage />} />
              <Route path="/workspace" element={<InterviewWorkspacePage />} />
              <Route path="/report"    element={<ReportPage />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </StoreProvider>
    </ThemeProvider>
  );
}
