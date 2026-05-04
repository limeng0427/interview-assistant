import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import { useStore } from '@/store/interviewStore';
import { aiService } from '@/services/aiService';
import { storageService } from '@/services/storageService';
import { FinalReport } from '@/components/FinalReport';
import { EmptyState } from '@/components/EmptyState';

export default function ReportPage() {
  const navigate = useNavigate();
  const { state, dispatch, activeSession } = useStore();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const session = activeSession;
  const report = state.activeReport ?? (session ? storageService.getReportForSession(session.id) : null);

  const generate = async () => {
    if (!session) return;
    setGenerating(true);
    setError(null);
    try {
      const r = await aiService.generateReport({ session });
      storageService.saveReport(r);
      dispatch({ type: 'SET_ACTIVE_REPORT', report: r });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  // Auto-generate if we have a session but no report yet
  useEffect(() => {
    if (session && !report && !generating) {
      generate();
    }
  }, [session?.id]);

  const handleCopy = () => {
    if (!report) return;
    const text = [
      `Interview Report — ${session?.setup.candidateName ?? session?.setup.jobTitle}`,
      `Role: ${session?.setup.jobTitle} (${session?.setup.seniority})`,
      `Recommendation: ${report.recommendation.toUpperCase()}`,
      '',
      'Summary:',
      report.candidateSummary,
      '',
      'Technical Strengths:',
      ...report.technicalStrengths.map((s) => `• ${s}`),
      '',
      'Concerns:',
      ...report.concerns.map((c) => `• ${c}`),
    ].join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  if (!session) {
    return (
      <Box sx={{ p: 4 }}>
        <EmptyState
          icon={<AssessmentOutlinedIcon />}
          title="No active interview"
          description="Set up and complete an interview to generate a report."
          action={{ label: 'New interview', onClick: () => navigate('/new') }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, pb: 8, maxWidth: 1100, mx: 'auto', width: '100%' }}>
      {/* Page header */}
      <Box sx={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        mb: 3, pb: 3, borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 2,
      }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Workflow / Final report
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5 }}>
            {session.setup.candidateName ? `${session.setup.candidateName} — Report` : 'Interview Report'}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {session.setup.jobTitle} · {session.setup.seniority}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/workspace')}>
            Back to workspace
          </Button>
          {report && (
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={generate} disabled={generating}>
              Regenerate
            </Button>
          )}
        </Box>
      </Box>

      {/* Loading */}
      {generating && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Analysing interview data and generating report…
          </Typography>
        </Box>
      )}

      {/* Error */}
      {error && !generating && (
        <Alert severity="error" action={<Button onClick={generate} size="small">Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* Report */}
      {!generating && report && (
        <FinalReport report={report} session={session} onCopy={handleCopy} copied={copied} />
      )}
    </Box>
  );
}
