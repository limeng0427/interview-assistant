import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar, Chip, Tooltip,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import { useStore } from '@/store/interviewStore';

const DRAWER_WIDTH = 240;

const WORKFLOW_ITEMS = [
  { path: '/',          label: 'Dashboard',     icon: <DashboardOutlinedIcon /> },
  { path: '/new',       label: 'New Interview', icon: <AddCircleOutlineIcon /> },
  { path: '/workspace', label: 'Workspace',     icon: <WorkOutlineIcon /> },
  { path: '/report',    label: 'Final Report',  icon: <AssessmentOutlinedIcon /> },
];

const LIBRARY_ITEMS = [
  { path: '/library',  label: 'Question Library', icon: <BookOutlinedIcon /> },
  { path: '/settings', label: 'Settings',          icon: <SettingsOutlinedIcon /> },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useStore();

  const mode = state.activeSessionId
    ? state.sessions.find((s) => s.id === state.activeSessionId)?.setup.mode ?? 'interviewer'
    : 'interviewer';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            bgcolor: 'rgba(248, 248, 251, 0.98)',
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        {/* Brand */}
        <Box sx={{ px: 2, pt: 2.5, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '9px',
              background: 'linear-gradient(135deg, #5C6BC0 0%, #3949AB 100%)',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 2px 4px rgba(57,73,171,0.3)',
            }}>
              <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 13, fontFamily: '"Inter Tight", sans-serif' }}>
                IA
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 600, fontSize: 14.5, lineHeight: 1.2 }}>
                Interview
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary', lineHeight: 1 }}>
                Assistant
              </Typography>
            </Box>
          </Box>

          {/* Mode toggle */}
          <Box sx={{
            display: 'flex', p: '3px',
            bgcolor: 'rgba(92,107,192,0.06)',
            border: '1px solid', borderColor: 'divider',
            borderRadius: '10px', gap: '2px',
          }}>
            {(['interviewer', 'interviewee'] as const).map((m) => (
              <Box
                key={m}
                onClick={() => {
                  if (state.activeSessionId) {
                    const session = state.sessions.find(s => s.id === state.activeSessionId);
                    if (session) {
                      dispatch({ type: 'UPDATE_SESSION', session: { ...session, setup: { ...session.setup, mode: m } } });
                    }
                  }
                }}
                sx={{
                  flex: 1, py: 0.75, px: 1, borderRadius: '7px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                  bgcolor: mode === m ? 'background.paper' : 'transparent',
                  boxShadow: mode === m ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
                  color: mode === m ? 'text.primary' : 'text.secondary',
                  fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
                  userSelect: 'none',
                }}
              >
                {m === 'interviewer'
                  ? <><GroupsOutlinedIcon sx={{ fontSize: 13 }} /> Interviewer</>
                  : <><PersonOutlineIcon sx={{ fontSize: 13 }} /> Interviewee</>
                }
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ mx: 2 }} />

        {/* Workflow nav */}
        <Box sx={{ px: 1.5, pt: 1 }}>
          <Typography variant="overline" sx={{ px: 1, color: 'text.secondary', opacity: 0.7 }}>
            Workflow
          </Typography>
          <List dense disablePadding sx={{ mt: 0.5 }}>
            {WORKFLOW_ITEMS.map(({ path, label, icon }) => {
              const active = location.pathname === path;
              return (
                <ListItem key={path} disablePadding sx={{ mb: 0.25 }}>
                  <ListItemButton
                    selected={active}
                    onClick={() => navigate(path)}
                    sx={{
                      borderRadius: '8px', py: 0.875, px: 1.25,
                      '& .MuiListItemIcon-root': {
                        color: active ? 'primary.main' : 'text.secondary',
                        minWidth: 34,
                      },
                      '&.Mui-selected': {
                        bgcolor: 'rgba(92,107,192,0.09)',
                        border: '1px solid rgba(92,107,192,0.15)',
                        boxShadow: '0 1px 2px rgba(92,107,192,0.08)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ '& svg': { fontSize: 18 } }}>{icon}</ListItemIcon>
                    <ListItemText
                      primary={label}
                      primaryTypographyProps={{ fontSize: 13.5, fontWeight: active ? 600 : 400 }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Library nav */}
        <Box sx={{ px: 1.5, pt: 1.5 }}>
          <Typography variant="overline" sx={{ px: 1, color: 'text.secondary', opacity: 0.7 }}>
            Library
          </Typography>
          <List dense disablePadding sx={{ mt: 0.5 }}>
            {LIBRARY_ITEMS.map(({ path, label, icon }) => (
              <ListItem key={path} disablePadding sx={{ mb: 0.25 }}>
                <Tooltip title="Coming soon" placement="right">
                  <ListItemButton disabled sx={{ borderRadius: '8px', py: 0.875, px: 1.25 }}>
                    <ListItemIcon sx={{ '& svg': { fontSize: 18 }, minWidth: 34 }}>{icon}</ListItemIcon>
                    <ListItemText
                      primary={label}
                      primaryTypographyProps={{ fontSize: 13.5 }}
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Footer user area */}
        <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Avatar sx={{ width: 28, height: 28, fontSize: 12, fontWeight: 600,
              background: 'linear-gradient(135deg, #FFAB76, #FF7043)' }}>
              JR
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>Jordan Reyes</Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary', lineHeight: 1.2 }}>Hiring manager</Typography>
            </Box>
            <Chip label="Free" size="small" sx={{ fontSize: 10, height: 18 }} />
          </Box>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
