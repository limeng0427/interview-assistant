import { Box, Typography, LinearProgress, Chip } from '@mui/material';
import type { InterviewQuestion, QuestionGroup } from '@/types/interview';

interface ProgressSummaryProps {
  questions: InterviewQuestion[];
  compact?: boolean;
}

export function ProgressSummary({ questions, compact }: ProgressSummaryProps) {
  const total = questions.length;
  const answered = questions.filter((q) => q.status !== 'not-asked').length;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 100 }}>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(92,107,192,0.12)' }}
          />
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {answered}/{total}
        </Typography>
      </Box>
    );
  }

  const goodCount     = questions.filter((q) => q.status === 'good').length;
  const partialCount  = questions.filter((q) => q.status === 'partial').length;
  const poorCount     = questions.filter((q) => q.status === 'poor').length;
  const followupCount = questions.filter((q) => q.status === 'follow-up').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.75 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{pct}%</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{answered} of {total} reviewed</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{ height: 8, borderRadius: 4, mb: 1.5, bgcolor: 'rgba(92,107,192,0.10)' }}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {goodCount > 0 && <Chip label={`${goodCount} Good`} size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }} />}
        {partialCount > 0 && <Chip label={`${partialCount} Partial`} size="small" sx={{ bgcolor: '#FFF8E1', color: '#F57F17', fontWeight: 600 }} />}
        {poorCount > 0 && <Chip label={`${poorCount} Poor`} size="small" sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 600 }} />}
        {followupCount > 0 && <Chip label={`${followupCount} Follow-up`} size="small" sx={{ bgcolor: '#EDE7F6', color: '#512DA8', fontWeight: 600 }} />}
      </Box>
    </Box>
  );
}

export function GroupProgressBar({ questions, group }: { questions: InterviewQuestion[]; group: QuestionGroup }) {
  const groupQs = questions.filter((q) => q.group === group);
  const answered = groupQs.filter((q) => q.status !== 'not-asked').length;
  const pct = groupQs.length > 0 ? Math.round((answered / groupQs.length) * 100) : 0;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: 'rgba(92,107,192,0.10)' }}
      />
      <Typography sx={{ fontSize: 10.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums', minWidth: 30 }}>
        {answered}/{groupQs.length}
      </Typography>
    </Box>
  );
}
