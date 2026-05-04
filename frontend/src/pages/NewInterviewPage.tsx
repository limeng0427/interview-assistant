import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip, Grid,
  CircularProgress, Alert, Divider, ToggleButton, ToggleButtonGroup,
  FormHelperText, Stepper, Step, StepLabel,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useStore } from '@/store/interviewStore';
import { aiService } from '@/services/aiService';
import type { InterviewMode, SeniorityLevel, QuestionGroup } from '@/types/interview';
import { GROUP_LABELS } from '@/components/QuestionGroupSidebar';

const ALL_GROUPS: QuestionGroup[] = [
  'technical', 'system-design', 'behavioural', 'leadership',
  'communication', 'culture-fit', 'problem-solving', 'domain-knowledge',
];

const schema = z.object({
  mode: z.enum(['interviewer', 'interviewee'] as const),
  candidateName: z.string().optional(),
  jobTitle: z.string().min(2, 'Job title is required'),
  jobDescription: z.string().min(20, 'Please paste the full job description (at least 20 chars)'),
  seniority: z.enum(['junior', 'intermediate', 'senior', 'lead'] as const),
  selectedGroups: z.array(z.string()).min(1, 'Select at least one question group'),
  questionsPerGroup: z.number().min(1).max(8),
});

type FormValues = z.infer<typeof schema>;

const SENIORITY_OPTIONS: Array<{ value: SeniorityLevel; label: string }> = [
  { value: 'junior',        label: 'Junior' },
  { value: 'intermediate',  label: 'Intermediate' },
  { value: 'senior',        label: 'Senior' },
  { value: 'lead',          label: 'Lead' },
];

export default function NewInterviewPage() {
  const navigate = useNavigate();
  const { dispatch } = useStore();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mode: 'interviewer',
      candidateName: '',
      jobTitle: '',
      jobDescription: '',
      seniority: 'senior',
      selectedGroups: ['technical', 'behavioural', 'system-design'],
      questionsPerGroup: 4,
    },
  });

  const selectedGroups = watch('selectedGroups');
  const questionsPerGroup = watch('questionsPerGroup');
  const mode = watch('mode');
  const jobTitle = watch('jobTitle');
  const seniority = watch('seniority');

  const toggleGroup = (group: QuestionGroup) => {
    const current = selectedGroups;
    setValue(
      'selectedGroups',
      current.includes(group) ? current.filter((g) => g !== group) : [...current, group],
      { shouldValidate: true }
    );
  };

  const onSubmit = async (values: FormValues) => {
    setGenerating(true);
    setError(null);
    try {
      const questions = await aiService.generateQuestions({
        mode: values.mode as InterviewMode,
        jobTitle: values.jobTitle,
        jobDescription: values.jobDescription,
        seniority: values.seniority as SeniorityLevel,
        groups: values.selectedGroups as QuestionGroup[],
        questionsPerGroup: values.questionsPerGroup,
      });

      const session = {
        id: uuid(),
        setup: {
          mode: values.mode as InterviewMode,
          candidateName: values.candidateName,
          jobTitle: values.jobTitle,
          jobDescription: values.jobDescription,
          seniority: values.seniority as SeniorityLevel,
          selectedGroups: values.selectedGroups as QuestionGroup[],
          questionsPerGroup: values.questionsPerGroup,
        },
        questions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_SESSION', session });
      navigate('/workspace');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate questions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const totalQuestions = selectedGroups.length * questionsPerGroup;

  return (
    <Box sx={{ p: 4, pb: 8, maxWidth: 1100, mx: 'auto', width: '100%' }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 3, pb: 3, borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Workflow / New interview
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5 }}>Set up a new interview</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {mode === 'interviewer'
              ? 'Configure the role, then let the assistant draft your question set.'
              : 'Configure the role you\'re practising for. We\'ll draft realistic questions and example answers.'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<CloseIcon />} onClick={() => navigate('/')}>Cancel</Button>
          <Button variant="outlined" startIcon={<SaveOutlinedIcon />}>Save draft</Button>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Left: form */}
          <Grid item xs={12} md={8}>
            {/* Mode selector */}
            <Card elevation={1} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Mode</Typography>
                <Controller
                  name="mode"
                  control={control}
                  render={({ field }) => (
                    <ToggleButtonGroup exclusive value={field.value} onChange={(_, v) => v && field.onChange(v)} size="small">
                      <ToggleButton value="interviewer" sx={{ gap: 0.75, px: 2 }}>
                        <GroupsOutlinedIcon sx={{ fontSize: 16 }} /> Interviewer
                      </ToggleButton>
                      <ToggleButton value="interviewee" sx={{ gap: 0.75, px: 2 }}>
                        <PersonOutlineIcon sx={{ fontSize: 16 }} /> Interviewee
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )}
                />
              </CardContent>
            </Card>

            {/* Role */}
            <Card elevation={1} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>1. Role</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={7}>
                    <Controller
                      name="jobTitle"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Job title"
                          fullWidth
                          size="medium"
                          error={!!errors.jobTitle}
                          helperText={errors.jobTitle?.message}
                          placeholder="e.g. Senior AI Engineer"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <Controller
                      name="candidateName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Candidate name (optional)"
                          fullWidth
                          size="medium"
                          placeholder="e.g. Maya Okafor"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="jobDescription"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Job description"
                          fullWidth
                          multiline
                          rows={8}
                          error={!!errors.jobDescription}
                          helperText={errors.jobDescription?.message ?? `${field.value.length} chars · paste or write`}
                          placeholder="Paste the full job description here…"
                        />
                      )}
                    />
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mt: 0.75 }}>
                      <AutoAwesomeIcon sx={{ fontSize: 12, color: 'primary.main' }} />
                      Pasting a JD helps the assistant tailor questions and example answers.
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Question groups */}
            <Card elevation={1} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>2. Question groups</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {selectedGroups.length} selected · ~{totalQuestions} questions total
                  </Typography>
                </Box>
                {errors.selectedGroups && (
                  <FormHelperText error sx={{ mb: 1 }}>{errors.selectedGroups.message}</FormHelperText>
                )}
                <Grid container spacing={1}>
                  {ALL_GROUPS.map((group) => {
                    const on = selectedGroups.includes(group);
                    return (
                      <Grid item xs={12} sm={6} key={group}>
                        <Box
                          onClick={() => toggleGroup(group)}
                          sx={{
                            display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25,
                            border: '1px solid',
                            borderColor: on ? 'rgba(92,107,192,0.4)' : 'divider',
                            borderRadius: 2.5, cursor: 'pointer', userSelect: 'none',
                            bgcolor: on ? 'rgba(92,107,192,0.05)' : 'background.paper',
                            transition: 'all 0.12s',
                          }}
                        >
                          <Box sx={{
                            width: 28, height: 28, borderRadius: 1.5, display: 'grid', placeItems: 'center',
                            bgcolor: on ? 'white' : 'rgba(0,0,0,0.05)',
                            color: on ? 'primary.main' : 'text.secondary',
                          }}>
                            <CheckIcon sx={{ fontSize: 14, opacity: on ? 1 : 0 }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: 13.5, fontWeight: on ? 600 : 400, color: on ? 'text.primary' : 'text.secondary' }}>
                              {GROUP_LABELS[group]}
                            </Typography>
                          </Box>
                          <Box sx={{
                            width: 18, height: 18, borderRadius: '4px',
                            border: '1.5px solid',
                            borderColor: on ? 'primary.main' : 'rgba(0,0,0,0.25)',
                            bgcolor: on ? 'primary.main' : 'transparent',
                            display: 'grid', placeItems: 'center', color: 'white',
                            flexShrink: 0,
                          }}>
                            {on && <CheckIcon sx={{ fontSize: 12 }} />}
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>

            {/* Generation settings */}
            <Card elevation={1}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>3. Generation settings</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary', display: 'block', mb: 1 }}>
                      Seniority level
                    </Typography>
                    <Controller
                      name="seniority"
                      control={control}
                      render={({ field }) => (
                        <Box sx={{ display: 'flex', p: '3px', bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                          {SENIORITY_OPTIONS.map((opt) => {
                            const on = field.value === opt.value;
                            return (
                              <Box
                                key={opt.value}
                                onClick={() => field.onChange(opt.value)}
                                sx={{
                                  flex: 1, py: 0.875, px: 0.5, borderRadius: 1.5, cursor: 'pointer',
                                  textAlign: 'center', fontSize: 12.5, fontWeight: on ? 600 : 400,
                                  bgcolor: on ? 'background.paper' : 'transparent',
                                  color: on ? 'text.primary' : 'text.secondary',
                                  boxShadow: on ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                                  userSelect: 'none', transition: 'all 0.12s',
                                }}
                              >
                                {opt.label}
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary', display: 'block', mb: 1 }}>
                      Questions per group
                    </Typography>
                    <Controller
                      name="questionsPerGroup"
                      control={control}
                      render={({ field }) => (
                        <Box sx={{ display: 'flex', p: '3px', bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                          {[2, 3, 4, 5, 6].map((n) => {
                            const on = field.value === n;
                            return (
                              <Box
                                key={n}
                                onClick={() => field.onChange(n)}
                                sx={{
                                  flex: 1, py: 0.875, borderRadius: 1.5, cursor: 'pointer',
                                  textAlign: 'center', fontSize: 12.5, fontWeight: on ? 600 : 400,
                                  bgcolor: on ? 'background.paper' : 'transparent',
                                  color: on ? 'text.primary' : 'text.secondary',
                                  boxShadow: on ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                                  userSelect: 'none', transition: 'all 0.12s',
                                }}
                              >
                                {n}
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Right: summary sidebar */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'sticky', top: 20 }}>
              <Card elevation={1} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Summary</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {[
                      { label: 'Mode', value: mode },
                      { label: 'Role', value: jobTitle || '—' },
                      { label: 'Seniority', value: seniority },
                      { label: 'Groups', value: selectedGroups.length },
                      { label: 'Total questions', value: <b style={{ color: '#1C1B2E' }}>~{totalQuestions}</b> },
                    ].map(({ label, value }) => (
                      <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
                        <Typography sx={{ fontSize: 13, color: 'text.primary', textTransform: 'capitalize' }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {error && <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>{error}</Alert>}

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={generating || selectedGroups.length === 0}
                    startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                    sx={{ py: 1.25, fontSize: 14 }}
                  >
                    {generating ? 'Generating…' : 'Generate questions'}
                  </Button>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ bgcolor: 'rgba(92,107,192,0.04)', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: 1.6 }}>
                    Generated drafts are saved to your browser. You can edit any question or regenerate per group.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
