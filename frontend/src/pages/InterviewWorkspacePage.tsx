import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Card, CardContent, Alert,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AddIcon from '@mui/icons-material/Add';
import { useStore } from '@/store/interviewStore';
import { QuestionCard } from '@/components/QuestionCard';
import { QuestionGroupSidebar } from '@/components/QuestionGroupSidebar';
import { ProgressSummary } from '@/components/ProgressSummary';
import { EmptyState } from '@/components/EmptyState';
import { useState } from 'react';
import type { QuestionGroup, QuestionStatus } from '@/types/interview';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';

export default function InterviewWorkspacePage() {
  const navigate = useNavigate();
  const { state, dispatch, activeSession } = useStore();
  const [activeGroup, setActiveGroup] = useState<QuestionGroup | null>(null);
  const [showExamples, setShowExamples] = useState(true);

  const session = activeSession;
  const groups = session ? [...new Set(session.questions.map((q) => q.group))] as QuestionGroup[] : [];

  // Set initial active group
  useEffect(() => {
    if (groups.length > 0 && !activeGroup) {
      setActiveGroup(groups[0]);
    }
  }, [groups.length]);

  // Keyboard shortcuts: 1-5 mark active question; N focuses notes
  useEffect(() => {
    if (!session) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        if (e.key === 'Escape') target.blur();
        return;
      }
      const statusMap: Record<string, QuestionStatus> = {
        '1': 'asked', '2': 'good', '3': 'partial', '4': 'poor', '5': 'follow-up',
      };
      if (statusMap[e.key] && activeGroup) {
        const groupQs = session.questions.filter((q) => q.group === activeGroup);
        const first = groupQs[0];
        if (first) {
          dispatch({ type: 'SET_QUESTION_STATUS', sessionId: session.id, questionId: first.id, status: statusMap[e.key] });
        }
      }
      if (e.key === 'n' || e.key === 'N') {
        const notesEl = document.querySelector('[data-notes]') as HTMLTextAreaElement | null;
        if (notesEl) { e.preventDefault(); notesEl.focus(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [session, activeGroup, dispatch]);

  if (!session) {
    return (
      <Box sx={{ p: 4 }}>
        <EmptyState
          icon={<WorkOutlineIcon />}
          title="No active interview"
          description="Set up a new interview to start the workspace."
          action={{ label: 'New interview', onClick: () => navigate('/new') }}
        />
      </Box>
    );
  }

  const currentGroupQuestions = activeGroup
    ? session.questions.filter((q) => q.group === activeGroup)
    : [];

  const { done: answeredCount } = (() => {
    const done = session.questions.filter((q) => q.status !== 'not-asked').length;
    return { done };
  })();

  const canGenerateReport = answeredCount > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Page header */}
      <Box sx={{
        px: 4, py: 3, borderBottom: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 2,
      }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Workflow / Workspace
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5 }}>
            {session.setup.candidateName || session.setup.jobTitle}
            {session.setup.candidateName && (
              <Typography component="span" variant="h5" sx={{ color: 'text.secondary', fontWeight: 400, ml: 1 }}>
                — {session.setup.jobTitle}
              </Typography>
            )}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {session.setup.mode === 'interviewer'
              ? 'Live interview'
              : `Practice session · ${answeredCount} of ${session.questions.length} reviewed`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant={showExamples ? 'outlined' : 'contained'}
            startIcon={showExamples ? <VisibilityOffIcon /> : <VisibilityIcon />}
            onClick={() => setShowExamples((v) => !v)}
            color={showExamples ? 'inherit' : 'primary'}
          >
            {showExamples ? 'Hide examples' : 'Show examples'}
          </Button>
          <ProgressSummary questions={session.questions} compact />
          <Button
            variant="contained"
            endIcon={<ChevronRightIcon />}
            disabled={!canGenerateReport}
            onClick={() => navigate('/report')}
          >
            Generate report
          </Button>
        </Box>
      </Box>

      {!canGenerateReport && (
        <Alert severity="info" sx={{ mx: 4, mt: 2, fontSize: 13 }}>
          Mark at least one question to enable report generation.
        </Alert>
      )}

      {/* Body: sidebar + questions */}
      <Grid container sx={{ flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <Grid item sx={{
          width: 260, flexShrink: 0,
          borderRight: '1px solid', borderColor: 'divider',
          p: 2, position: 'sticky', top: 0, alignSelf: 'flex-start',
          maxHeight: 'calc(100vh - 140px)', overflowY: 'auto',
        }}>
          <Box sx={{ mb: 2 }}>
            <ProgressSummary questions={session.questions} />
          </Box>
          <QuestionGroupSidebar
            groups={groups}
            activeGroup={activeGroup ?? groups[0]}
            onGroupChange={setActiveGroup}
            questions={session.questions}
          />
        </Grid>

        {/* Main content */}
        <Grid item sx={{ flex: 1, minWidth: 0, p: 3, overflowY: 'auto' }}>
          {activeGroup && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {/* group label is shown in sidebar, show count here */}
                    {currentGroupQuestions.filter(q => q.status !== 'not-asked').length} of {currentGroupQuestions.length} reviewed
                  </Typography>
                </Box>
                <Button size="small" variant="outlined" startIcon={<AddIcon />}>Add question</Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {currentGroupQuestions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={i}
                    onStatusChange={(status) =>
                      dispatch({ type: 'SET_QUESTION_STATUS', sessionId: session.id, questionId: q.id, status })
                    }
                    onNotesChange={(notes) =>
                      dispatch({ type: 'SET_QUESTION_NOTES', sessionId: session.id, questionId: q.id, notes })
                    }
                    showExampleAnswer={showExamples}
                    defaultExpanded={i === 0}
                  />
                ))}
              </Box>
            </>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
