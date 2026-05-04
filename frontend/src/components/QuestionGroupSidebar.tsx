import {
  Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Chip, LinearProgress,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/CodeOutlined';
import LayersIcon from '@mui/icons-material/LayersOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import StarIcon from '@mui/icons-material/StarOutlined';
import ChatIcon from '@mui/icons-material/ChatOutlined';
import FavoriteIcon from '@mui/icons-material/FavoriteBorderOutlined';
import ExtensionIcon from '@mui/icons-material/ExtensionOutlined';
import AutoStoriesIcon from '@mui/icons-material/AutoStoriesOutlined';
import type { QuestionGroup, InterviewQuestion } from '@/types/interview';

const GROUP_ICONS: Record<QuestionGroup, React.ReactNode> = {
  technical:          <CodeIcon />,
  'system-design':    <LayersIcon />,
  behavioural:        <PeopleIcon />,
  leadership:         <StarIcon />,
  communication:      <ChatIcon />,
  'culture-fit':      <FavoriteIcon />,
  'problem-solving':  <ExtensionIcon />,
  'domain-knowledge': <AutoStoriesIcon />,
};

const GROUP_LABELS: Record<QuestionGroup, string> = {
  technical:          'Technical Skills',
  'system-design':    'System Design',
  behavioural:        'Behavioural',
  leadership:         'Leadership',
  communication:      'Communication',
  'culture-fit':      'Culture Fit',
  'problem-solving':  'Problem Solving',
  'domain-knowledge': 'Domain Knowledge',
};

interface QuestionGroupSidebarProps {
  groups: QuestionGroup[];
  activeGroup: QuestionGroup;
  onGroupChange: (group: QuestionGroup) => void;
  questions: InterviewQuestion[];
}

export function QuestionGroupSidebar({
  groups, activeGroup, onGroupChange, questions,
}: QuestionGroupSidebarProps) {
  const forGroup = (group: QuestionGroup) => questions.filter((q) => q.group === group);

  return (
    <Box>
      <Typography variant="overline" sx={{ px: 1.25, color: 'text.secondary', opacity: 0.7, display: 'block', mb: 0.5 }}>
        Question groups
      </Typography>
      <List dense disablePadding>
        {groups.map((group) => {
          const qs = forGroup(group);
          const answered = qs.filter((q) => q.status !== 'not-asked').length;
          const pct = qs.length > 0 ? Math.round((answered / qs.length) * 100) : 0;
          const active = activeGroup === group;
          const allDone = answered === qs.length && qs.length > 0;

          return (
            <ListItem key={group} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={active}
                onClick={() => onGroupChange(group)}
                sx={{
                  borderRadius: '8px',
                  py: 1, px: 1.25,
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  '& .MuiListItemIcon-root': {
                    color: active ? 'primary.main' : 'text.secondary',
                    minWidth: 32,
                  },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(92,107,192,0.09)',
                    border: '1px solid rgba(92,107,192,0.18)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <ListItemIcon sx={{ '& svg': { fontSize: 16 } }}>
                    {GROUP_ICONS[group]}
                  </ListItemIcon>
                  <ListItemText
                    primary={GROUP_LABELS[group]}
                    primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 600 : 400 }}
                    sx={{ my: 0 }}
                  />
                  <Chip
                    label={`${answered}/${qs.length}`}
                    size="small"
                    sx={{
                      height: 18, fontSize: 10.5, fontWeight: 600,
                      bgcolor: allDone ? '#E8F5E9' : 'rgba(0,0,0,0.06)',
                      color: allDone ? '#2E7D32' : 'text.secondary',
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    mt: 0.75, height: 3, borderRadius: 2, ml: 4,
                    bgcolor: 'rgba(92,107,192,0.10)',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

export { GROUP_LABELS, GROUP_ICONS };
