import React, { useState } from 'react';
import {
  Card, CardContent, Box, Typography, Chip, Button, ButtonGroup,
  TextField, Collapse, IconButton, Tooltip, Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import type { InterviewQuestion, QuestionStatus } from '@/types/interview';

// Status button configuration
const STATUS_OPTIONS: Array<{
  value: QuestionStatus;
  label: string;
  key: string;
  bgcolor: string;
  color: string;
  borderColor: string;
}> = [
  { value: 'asked',     label: 'Asked',     key: '1', bgcolor: 'rgba(84,110,122,0.10)', color: '#37474F', borderColor: 'rgba(84,110,122,0.3)' },
  { value: 'good',      label: 'Good',      key: '2', bgcolor: '#E8F5E9', color: '#2E7D32', borderColor: 'rgba(46,125,50,0.35)' },
  { value: 'partial',   label: 'Partial',   key: '3', bgcolor: '#FFF8E1', color: '#E65100', borderColor: 'rgba(230,81,0,0.35)' },
  { value: 'poor',      label: 'Poor',      key: '4', bgcolor: '#FFEBEE', color: '#C62828', borderColor: 'rgba(198,40,40,0.35)' },
  { value: 'follow-up', label: 'Follow-up', key: '5', bgcolor: '#EDE7F6', color: '#512DA8', borderColor: 'rgba(81,45,168,0.35)' },
];

const DIFFICULTY_COLORS: Record<string, { bgcolor: string; color: string }> = {
  easy:   { bgcolor: '#E8F5E9', color: '#2E7D32' },
  medium: { bgcolor: '#FFF8E1', color: '#E65100' },
  hard:   { bgcolor: '#FFEBEE', color: '#C62828' },
};

interface QuestionCardProps {
  question: InterviewQuestion;
  index: number;
  onStatusChange: (status: QuestionStatus) => void;
  onNotesChange: (notes: string) => void;
  showExampleAnswer: boolean;
  defaultExpanded?: boolean;
}

export function QuestionCard({
  question, index, onStatusChange, onNotesChange, showExampleAnswer, defaultExpanded = false,
}: QuestionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [exampleOpen, setExampleOpen] = useState(false);
  const [criteriaOpen, setCriteriaOpen] = useState(false);

  const diffColors = DIFFICULTY_COLORS[question.difficulty] ?? DIFFICULTY_COLORS.medium;
  const isAsked = question.status !== 'not-asked';

  return (
    <Card
      elevation={expanded ? 2 : 1}
      sx={{
        borderColor: isAsked ? 'rgba(92,107,192,0.2)' : 'rgba(92,107,192,0.08)',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        overflow: 'visible',
      }}
    >
      {/* Header row — always visible */}
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          display: 'flex', gap: 1.5, alignItems: 'flex-start',
          p: expanded ? '16px 18px 12px' : '14px 18px',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        {/* Index badge */}
        <Box sx={{
          flexShrink: 0, width: 26, height: 26, borderRadius: '6px',
          bgcolor: 'rgba(0,0,0,0.05)', display: 'grid', placeItems: 'center',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11, fontWeight: 500,
          color: 'text.secondary', mt: '2px',
        }}>
          {String(index + 1).padStart(2, '0')}
        </Box>

        {/* Question text */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 500, lineHeight: 1.55, color: 'text.primary' }}>
            {question.question}
          </Typography>
          {!expanded && (
            <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
              {question.evaluationCriteria.slice(0, 2).map((c, i) => (
                <Typography key={i} variant="caption" sx={{ color: 'text.secondary' }}>
                  {i > 0 ? ' · ' : ''}{c}
                </Typography>
              ))}
            </Box>
          )}
        </Box>

        {/* Right: status + difficulty + chevron */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          <Chip
            label={question.difficulty}
            size="small"
            sx={{ height: 20, fontSize: 10.5, ...diffColors, fontWeight: 600, textTransform: 'capitalize' }}
          />
          <StatusChip status={question.status} />
          <IconButton size="small" sx={{ color: 'text.secondary', ml: 0.5 }}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* Expanded body */}
      <Collapse in={expanded} timeout="auto">
        <Divider sx={{ mx: 2 }} />
        <CardContent sx={{ pt: 2, pb: '16px !important' }}>

          {/* Mark answer */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              Mark answer
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {STATUS_OPTIONS.map((opt) => {
                const on = question.status === opt.value;
                return (
                  <Tooltip key={opt.value} title={`${opt.label} (${opt.key})`}>
                    <Button
                      size="small"
                      onClick={(e) => { e.stopPropagation(); onStatusChange(opt.value); }}
                      sx={{
                        borderRadius: '999px',
                        fontSize: 12, fontWeight: 600,
                        px: 1.5, py: 0.4,
                        bgcolor: on ? opt.bgcolor : 'transparent',
                        color: on ? opt.color : 'text.secondary',
                        border: '1px solid',
                        borderColor: on ? opt.borderColor : 'divider',
                        '&:hover': { bgcolor: opt.bgcolor, borderColor: opt.borderColor },
                      }}
                    >
                      {opt.label}
                      <Box component="span" sx={{
                        ml: 0.75, px: 0.5, py: 0.1, borderRadius: '4px', fontSize: 10,
                        bgcolor: 'rgba(0,0,0,0.06)', fontFamily: '"JetBrains Mono",monospace',
                        color: 'text.secondary',
                      }}>
                        {opt.key}
                      </Box>
                    </Button>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>

          {/* Evaluation criteria */}
          <Box sx={{ mb: 2 }}>
            <Button
              size="small"
              startIcon={criteriaOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setCriteriaOpen((v) => !v)}
              sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}
            >
              Evaluation criteria
            </Button>
            <Collapse in={criteriaOpen}>
              <Box component="ul" sx={{ m: 0, pl: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {question.evaluationCriteria.map((c, i) => (
                  <Box component="li" key={i} sx={{ display: 'flex', gap: 1, fontSize: 13, color: 'text.secondary' }}>
                    <Box component="span" sx={{ color: 'text.disabled', mt: 0.1 }}>—</Box>
                    {c}
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>

          {/* Example answer */}
          {showExampleAnswer && (
            <Box sx={{ mb: 2, bgcolor: 'rgba(92,107,192,0.04)', borderRadius: 2, overflow: 'hidden' }}>
              <Button
                size="small"
                startIcon={exampleOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                endIcon={<AutoAwesomeIcon sx={{ fontSize: '13px !important', color: 'primary.main' }} />}
                onClick={() => setExampleOpen((v) => !v)}
                sx={{
                  width: '100%', justifyContent: 'flex-start', px: 1.5, py: 1,
                  color: 'text.secondary', fontSize: 12, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}
              >
                Example answer
                <Chip label="AI guidance" size="small" sx={{ ml: 1, height: 18, fontSize: 10, bgcolor: 'rgba(92,107,192,0.1)', color: 'primary.main' }} />
              </Button>
              <Collapse in={exampleOpen}>
                <Typography sx={{ px: 2, pb: 2, fontSize: 13, lineHeight: 1.7, color: 'text.secondary' }}>
                  {question.exampleAnswer}
                </Typography>
              </Collapse>
            </Box>
          )}

          {/* Follow-up questions */}
          {question.followUpQuestions.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>Suggested follow-ups</Typography>
                <AutoAwesomeIcon sx={{ fontSize: 12, color: 'primary.light' }} />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {question.followUpQuestions.map((f, i) => (
                  <Chip
                    key={i}
                    icon={<QuizOutlinedIcon />}
                    label={f}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: 12, height: 'auto', py: 0.25 }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Notes */}
          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 0.75 }}>
              Notes <Box component="span" sx={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, bgcolor: 'rgba(0,0,0,0.06)', px: 0.5, py: 0.1, borderRadius: '4px' }}>N</Box>
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={2}
              placeholder="Type quick notes — what they said, signal you observed, follow-ups to remember…"
              value={question.notes}
              onChange={(e) => onNotesChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              inputProps={{ 'data-notes': true }}
              sx={{ '& .MuiInputBase-input': { fontSize: 13 } }}
            />
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
}

function StatusChip({ status }: { status: QuestionStatus }) {
  const map: Record<QuestionStatus, { label: string; bgcolor: string; color: string }> = {
    'not-asked':  { label: 'Not asked',  bgcolor: 'transparent', color: '#9E9E9E' },
    asked:        { label: 'Asked',      bgcolor: 'rgba(84,110,122,0.10)', color: '#37474F' },
    good:         { label: 'Good',       bgcolor: '#E8F5E9', color: '#2E7D32' },
    partial:      { label: 'Partial',    bgcolor: '#FFF8E1', color: '#E65100' },
    poor:         { label: 'Poor',       bgcolor: '#FFEBEE', color: '#C62828' },
    'follow-up':  { label: 'Follow-up',  bgcolor: '#EDE7F6', color: '#512DA8' },
  };
  const m = map[status];
  return (
    <Chip
      label={m.label}
      size="small"
      sx={{
        height: 22, fontSize: 11.5, fontWeight: 600,
        bgcolor: m.bgcolor, color: m.color,
        border: status === 'not-asked' ? '1px dashed #BDBDBD' : 'none',
      }}
    />
  );
}
