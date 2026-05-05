import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, CardActionArea, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, LinearProgress, Grid, TextField, InputAdornment,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';
import SearchIcon from '@mui/icons-material/Search';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useStore } from '@/store/interviewStore';
import { useAuth } from '@/hooks/useAuth';
import { storageService } from '@/services/storageService';

const REC_STYLES: Record<string, { label: string; bgcolor: string; color: string }> = {
  'strong-hire': { label: 'Strong hire', bgcolor: '#E8F5E9', color: '#2E7D32' },
  hire:          { label: 'Hire',        bgcolor: '#E3F2FD', color: '#0D47A1' },
  maybe:         { label: 'Maybe',       bgcolor: '#FFF8E1', color: '#E65100' },
  'no-hire':     { label: 'No hire',     bgcolor: '#FFEBEE', color: '#C62828' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
}

function avatarColor(name: string) {
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0) * 47, 0) % 360;
  return `hsl(${hue}, 55%, 60%)`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const allSessions = state.sessions;
  const sessions = search.trim()
    ? allSessions.filter((s) => {
        const q = search.toLowerCase();
        return (
          s.setup.candidateName?.toLowerCase().includes(q) ||
          s.setup.jobTitle.toLowerCase().includes(q)
        );
      })
    : allSessions;

  const mode = 'interviewer';

  const inProgress = allSessions.filter((s) => !storageService.getReportForSession(s.id));
  const withReports = allSessions.filter((s) => storageService.getReportForSession(s.id));

  const quickCards = mode === 'interviewer'
    ? [
        { title: 'Start a new interview', sub: 'Set up questions, run live, generate report.', icon: <AddCircleOutlineIcon />, primary: true, action: () => navigate('/new') },
        {
          title: inProgress[0] ? `Continue: ${inProgress[0].setup.candidateName || inProgress[0].setup.jobTitle}` : 'No interview in progress',
          sub: inProgress[0]
            ? `${inProgress[0].setup.jobTitle} · ${inProgress[0].questions.filter(q => q.status !== 'not-asked').length} of ${inProgress[0].questions.length} questions`
            : 'Start a new interview to get going.',
          icon: <PlayArrowIcon />,
          primary: false,
          action: inProgress[0] ? () => { dispatch({ type: 'SET_ACTIVE_SESSION', id: inProgress[0].id }); navigate('/workspace'); } : undefined,
          disabled: !inProgress[0],
        },
        { title: 'Open question library', sub: '142 saved questions across 8 groups', icon: <BookOutlinedIcon />, primary: false, action: undefined, disabled: true },
      ]
    : [
        { title: 'Practice a new role', sub: 'Get questions, example answers, feedback.', icon: <AddCircleOutlineIcon />, primary: true, action: () => navigate('/new') },
        {
          title: inProgress[0] ? 'Resume practice set' : 'No session in progress',
          sub: inProgress[0] ? `${inProgress[0].setup.jobTitle} · ${inProgress[0].questions.filter(q => q.status !== 'not-asked').length} of ${inProgress[0].questions.length} reviewed` : 'Start a new practice set.',
          icon: <PlayArrowIcon />,
          primary: false,
          action: inProgress[0] ? () => { dispatch({ type: 'SET_ACTIVE_SESSION', id: inProgress[0].id }); navigate('/workspace'); } : undefined,
          disabled: !inProgress[0],
        },
        { title: 'Browse answer library', sub: '320 example answers', icon: <BookOutlinedIcon />, primary: false, action: undefined, disabled: true },
      ];

  return (
    <Box sx={{ p: 4, pb: 8, maxWidth: 1100, mx: 'auto', width: '100%' }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 3, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
            Welcome back{user?.given_name ? `, ${user.given_name}` : ''}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {inProgress.length > 0
              ? `${inProgress.length} interview${inProgress.length > 1 ? 's' : ''} in progress · ${withReports.length} report${withReports.length !== 1 ? 's' : ''} ready.`
              : 'No interviews in progress. Start a new one to get going.'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search sessions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            sx={{ width: 200 }}
          />
          <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate('/new')}>
            New interview
          </Button>
        </Box>
      </Box>

      {/* Quick action cards */}
      <Grid container spacing={1.75} sx={{ mb: 4 }}>
        {quickCards.map((c, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Card
              elevation={1}
              sx={{
                height: '100%', minHeight: 140, cursor: c.disabled ? 'default' : 'pointer',
                bgcolor: c.primary ? 'text.primary' : 'background.paper',
                opacity: c.disabled && !c.primary ? 0.5 : 1,
                transition: 'box-shadow 0.15s',
                '&:hover': { boxShadow: c.disabled ? undefined : 3 },
              }}
            >
              <CardActionArea
                disabled={c.disabled}
                onClick={c.action}
                sx={{ height: '100%', p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1.5 }}
              >
                <Box sx={{
                  width: 34, height: 34, borderRadius: '8px',
                  bgcolor: c.primary ? 'rgba(255,255,255,0.12)' : 'rgba(92,107,192,0.10)',
                  color: c.primary ? 'white' : 'primary.main',
                  display: 'grid', placeItems: 'center',
                }}>
                  {c.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{
                    fontFamily: '"Inter Tight",sans-serif', fontSize: 16, fontWeight: 600,
                    letterSpacing: '-0.005em', lineHeight: 1.3, mb: 0.5,
                    color: c.primary ? 'white' : 'text.primary',
                  }}>
                    {c.title}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: c.primary ? 'rgba(255,255,255,0.65)' : 'text.secondary', lineHeight: 1.45 }}>
                    {c.sub}
                  </Typography>
                </Box>
                <Typography sx={{
                  fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5,
                  color: c.primary ? 'rgba(255,255,255,0.85)' : 'primary.main',
                }}>
                  {c.primary ? 'Get started' : 'Open'} <ChevronRightIcon sx={{ fontSize: 14 }} />
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent + stats */}
      <Grid container spacing={2.5}>
        {/* Recent interviews table */}
        <Grid item xs={12} md={8}>
          <Card elevation={1} sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6">Recent interviews</Typography>
              <Button size="small" variant="outlined">View all</Button>
            </Box>
            {sessions.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No interviews yet. <Button onClick={() => navigate('/new')} sx={{ p: 0 }}>Start one →</Button>
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                      {['Candidate / Role', 'Date', 'Progress', 'Outcome', ''].map((h) => (
                        <TableCell key={h} sx={{ fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions.map((s) => {
                      const report = storageService.getReportForSession(s.id);
                      const answered = s.questions.filter(q => q.status !== 'not-asked').length;
                      const initials = (s.setup.candidateName || s.setup.jobTitle).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                      const bg = avatarColor(s.setup.candidateName || s.id);
                      return (
                        <TableRow
                          key={s.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => {
                            dispatch({ type: 'SET_ACTIVE_SESSION', id: s.id });
                            navigate(report ? '/report' : '/workspace');
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 700, bgcolor: bg }}>{initials}</Avatar>
                              <Box>
                                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{s.setup.candidateName || '—'}</Typography>
                                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{s.setup.jobTitle}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{formatDate(s.updatedAt)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={s.questions.length > 0 ? Math.round((answered / s.questions.length) * 100) : 0}
                                sx={{ width: 60, height: 5, borderRadius: 3, bgcolor: 'rgba(92,107,192,0.10)' }}
                              />
                              <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                                {answered}/{s.questions.length}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {report ? (
                              <Chip
                                label={REC_STYLES[report.recommendation]?.label ?? report.recommendation}
                                size="small"
                                sx={{ ...REC_STYLES[report.recommendation], height: 22, fontSize: 11.5, fontWeight: 600 }}
                              />
                            ) : (
                              <Chip label="In progress" size="small" sx={{ bgcolor: 'rgba(84,110,122,0.10)', color: '#37474F', height: 22, fontSize: 11.5 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <ChevronRightIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

        {/* Side stats */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* This month */}
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">This month</Typography>
                  <Chip label="May 2026" size="small" />
                </Box>
                <Grid container spacing={2}>
                  {[
                    { n: sessions.length, l: 'Interviews' },
                    { n: withReports.length, l: 'Reports' },
                    { n: sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + s.questions.length, 0) / sessions.length) : 0, l: 'Avg questions' },
                    { n: sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + s.questions.filter(q => q.status !== 'not-asked').length / Math.max(s.questions.length, 1) * 100, 0) / sessions.length) + '%' : '0%', l: 'Avg coverage' },
                  ].map((stat, i) => (
                    <Grid item xs={6} key={i}>
                      <Typography sx={{ fontFamily: '"Inter Tight",sans-serif', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
                        {stat.n}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>{stat.l}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Tip */}
            <Card elevation={1} sx={{ bgcolor: 'rgba(92,107,192,0.04)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LightbulbOutlinedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                  <Typography variant="subtitle2">Keyboard tips</Typography>
                </Box>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
                  Press{' '}
                  {['1','2','3','4','5'].map((k) => (
                    <Box key={k} component="span" sx={{
                      fontFamily: '"JetBrains Mono",monospace', fontSize: 10.5, px: 0.5, py: 0.1,
                      bgcolor: 'rgba(0,0,0,0.07)', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.12)',
                      mx: 0.25, display: 'inline-block',
                    }}>{k}</Box>
                  ))}{' '}
                  on a question card to mark it without leaving the keyboard. Press{' '}
                  <Box component="span" sx={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10.5, px: 0.5, bgcolor: 'rgba(0,0,0,0.07)', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.12)' }}>N</Box>{' '}
                  to jump to notes.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
