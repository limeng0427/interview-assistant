import {
  Box, Typography, Card, CardContent, Chip, Button,
  Grid, Divider, List, ListItem, ListItemIcon, ListItemText, Alert,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PrintIcon from '@mui/icons-material/Print';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { CandidateReport, InterviewSession } from '@/types/interview';
import { GROUP_LABELS } from './QuestionGroupSidebar';

const REC_DISPLAY: Record<CandidateReport['recommendation'], { label: string; bgcolor: string; color: string }> = {
  'strong-hire': { label: 'Strong Hire', bgcolor: '#E8F5E9', color: '#1B5E20' },
  hire:          { label: 'Hire',        bgcolor: '#E3F2FD', color: '#0D47A1' },
  maybe:         { label: 'Maybe',       bgcolor: '#FFF8E1', color: '#E65100' },
  'no-hire':     { label: 'No Hire',     bgcolor: '#FFEBEE', color: '#B71C1C' },
};

interface FinalReportProps {
  report: CandidateReport;
  session: InterviewSession;
  onCopy: () => void;
  copied: boolean;
}

export function FinalReport({ report, session, onCopy, copied }: FinalReportProps) {
  const rec = REC_DISPLAY[report.recommendation];
  const { questions } = session;

  const groupStats = session.setup.selectedGroups.map((group) => {
    const qs = questions.filter((q) => q.group === group);
    const good = qs.filter((q) => q.status === 'good').length;
    const partial = qs.filter((q) => q.status === 'partial').length;
    const poor = qs.filter((q) => q.status === 'poor').length;
    const followup = qs.filter((q) => q.status === 'follow-up').length;
    const asked = qs.filter((q) => q.status === 'asked').length;
    return { group, qs, good, partial, poor, followup, asked };
  });

  return (
    <Box>
      {/* Recommendation banner */}
      <Card
        elevation={2}
        sx={{
          mb: 2,
          background: `linear-gradient(135deg, ${rec.bgcolor} 0%, #fff 100%)`,
          borderColor: 'rgba(92,107,192,0.15)',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                Overall Recommendation
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: rec.color, letterSpacing: '-0.02em' }}>
                {rec.label}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {questions.filter(q => q.status !== 'not-asked').length} of {questions.length} questions assessed
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(['no-hire', 'maybe', 'hire', 'strong-hire'] as const).map((r) => {
                const d = REC_DISPLAY[r];
                const active = r === report.recommendation;
                return (
                  <Box key={r} sx={{
                    px: 1.5, py: 0.75, borderRadius: 2, fontSize: 12, fontWeight: 600,
                    bgcolor: active ? 'text.primary' : 'transparent',
                    color: active ? 'white' : 'text.secondary',
                    border: '1px solid',
                    borderColor: active ? 'text.primary' : 'divider',
                  }}>
                    {d.label}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {/* Main column */}
        <Grid item xs={12} md={8}>
          {/* Summary */}
          <Card elevation={1} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="h6">Candidate Summary</Typography>
                <Chip icon={<AutoAwesomeIcon />} label="AI synthesised" size="small" sx={{ bgcolor: 'rgba(92,107,192,0.08)', color: 'primary.main', fontSize: 11 }} />
              </Box>
              <Typography sx={{ fontSize: 14, lineHeight: 1.7, color: 'text.secondary' }}>
                {report.candidateSummary}
              </Typography>
            </CardContent>
          </Card>

          {/* Strengths & concerns */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <ListCard
                title="Technical Strengths"
                items={report.technicalStrengths}
                icon={<CheckCircleOutlineIcon />}
                color="#2E7D32"
                bgcolor="#E8F5E9"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ListCard
                title="Behavioural Strengths"
                items={report.behaviouralStrengths}
                icon={<TrendingUpIcon />}
                color="#0D47A1"
                bgcolor="#E3F2FD"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ListCard
                title="Concerns / Risk Areas"
                items={report.concerns}
                icon={<WarningAmberIcon />}
                color="#C62828"
                bgcolor="#FFEBEE"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ListCard
                title="Recommended Follow-up"
                items={report.recommendedFollowUp}
                icon={<QuizOutlinedIcon />}
                color="#512DA8"
                bgcolor="#EDE7F6"
              />
            </Grid>
          </Grid>

          {/* Group breakdown */}
          <Card elevation={1}>
            <CardContent>
              <Typography variant="h6" gutterBottom>By Question Group</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {groupStats.map(({ group, qs, good, partial, poor, followup, asked }) => (
                  <Box key={group} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ flex: '0 0 160px', fontSize: 13, fontWeight: 500 }}>
                      {GROUP_LABELS[group]}
                    </Typography>
                    <Box sx={{ flex: 1, height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: 'rgba(0,0,0,0.06)', display: 'flex' }}>
                      {good > 0 && <Box sx={{ flex: good, bgcolor: '#43A047' }} />}
                      {partial > 0 && <Box sx={{ flex: partial, bgcolor: '#F9A825' }} />}
                      {poor > 0 && <Box sx={{ flex: poor, bgcolor: '#E53935' }} />}
                      {followup > 0 && <Box sx={{ flex: followup, bgcolor: '#7E57C2' }} />}
                      {asked > 0 && <Box sx={{ flex: asked, bgcolor: 'rgba(0,0,0,0.15)' }} />}
                    </Box>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums', minWidth: 28 }}>
                      {qs.length} q
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
                {[
                  { color: '#43A047', label: 'Good' },
                  { color: '#F9A825', label: 'Partial' },
                  { color: '#E53935', label: 'Poor' },
                  { color: '#7E57C2', label: 'Follow-up' },
                  { color: 'rgba(0,0,0,0.15)', label: 'Asked' },
                ].map(({ color, label }) => (
                  <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: color }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Side column */}
        <Grid item xs={12} md={4}>
          {/* Actions */}
          <Card elevation={1} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Export</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  fullWidth variant="outlined" startIcon={<ContentCopyIcon />}
                  onClick={onCopy}
                  color={copied ? 'success' : 'primary'}
                >
                  {copied ? 'Copied!' : 'Copy summary'}
                </Button>
                <Button fullWidth variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>
                  Export PDF
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Candidate info */}
          <Card elevation={1} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Interview details</Typography>
              {[
                { label: 'Role', value: session.setup.jobTitle },
                { label: 'Seniority', value: session.setup.seniority },
                { label: 'Mode', value: session.setup.mode },
                { label: 'Questions', value: `${questions.length} across ${session.setup.selectedGroups.length} groups` },
                { label: 'Report date', value: new Date(report.generatedAt).toLocaleDateString() },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.625, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>{value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Privacy note */}
          <Alert severity="info" icon={false} sx={{ fontSize: 12, borderRadius: 2 }}>
            Reports are saved locally to your browser. Use Export PDF to create a shareable copy.
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
}

function ListCard({
  title, items, icon, color, bgcolor,
}: {
  title: string; items: string[]; icon: React.ReactNode; color: string; bgcolor: string;
}) {
  return (
    <Card elevation={1} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Box sx={{ color, '& svg': { fontSize: 18 } }}>{icon}</Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography>
        </Box>
        {items.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>None noted.</Typography>
        ) : (
          <List dense disablePadding>
            {items.map((item, i) => (
              <ListItem key={i} disablePadding sx={{ mb: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 20, color }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
                </ListItemIcon>
                <ListItemText
                  primary={item}
                  primaryTypographyProps={{ fontSize: 13.5, lineHeight: 1.55, color: 'text.secondary' }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
