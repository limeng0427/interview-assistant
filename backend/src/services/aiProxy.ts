// AI proxy — calls Te Ihi gateway (SSE streaming) and collects the full response.
// Set AI_API_URL (https://te-ihi.kotahirau.com/) and AI_API_KEY in Lambda env vars.

import { v4 as uuid } from 'uuid';

// Domain types (mirrored from frontend/src/types/interview.ts)
type QuestionGroup = 'technical' | 'system-design' | 'behavioural' | 'leadership' |
  'communication' | 'culture-fit' | 'problem-solving' | 'domain-knowledge';
type QuestionStatus = 'not-asked' | 'asked' | 'good' | 'partial' | 'poor' | 'follow-up';
type SeniorityLevel = 'junior' | 'intermediate' | 'senior' | 'lead';
type InterviewMode = 'interviewer' | 'interviewee';
type OverallRecommendation = 'strong-hire' | 'hire' | 'maybe' | 'no-hire';

export interface InterviewQuestion {
  id: string;
  group: QuestionGroup;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  exampleAnswer: string;
  evaluationCriteria: string[];
  followUpQuestions: string[];
  status: QuestionStatus;
  notes: string;
}

export interface CandidateReport {
  sessionId: string;
  candidateSummary: string;
  technicalStrengths: string[];
  behaviouralStrengths: string[];
  concerns: string[];
  recommendedFollowUp: string[];
  recommendation: OverallRecommendation;
  generatedAt: string;
}

export interface GenerateQuestionsPayload {
  mode: InterviewMode;
  jobTitle: string;
  jobDescription: string;
  seniority: SeniorityLevel;
  groups: QuestionGroup[];
  questionsPerGroup: number;
}

export interface GenerateReportPayload {
  session: {
    id: string;
    setup: { candidateName?: string; jobTitle: string; seniority: SeniorityLevel; mode: InterviewMode };
    questions: Array<{ group: QuestionGroup; question: string; status: QuestionStatus; notes: string }>;
  };
}

interface TeIhiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callTeIhi(messages: TeIhiMessage[], maxTokens = 4096): Promise<string> {
  const AI_API_URL = process.env.AI_API_URL;
  const AI_API_KEY = process.env.AI_API_KEY;

  if (!AI_API_URL || !AI_API_KEY) {
    throw new Error('AI_API_URL and AI_API_KEY must be set in Lambda environment');
  }

  const res = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-te-ihi-key': AI_API_KEY,
    },
    body: JSON.stringify({
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      messages,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Te Ihi error ${res.status}: ${text}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    for (const frame of frames) {
      let event = 'message';
      let data = '';
      for (const line of frame.split('\n')) {
        if (line.startsWith('event: ')) event = line.slice(7).trim();
        else if (line.startsWith('data: ')) data = line.slice(6);
      }
      if (event === 'done') return fullContent;
      if (event === 'error') throw new Error((JSON.parse(data) as { error: string }).error);
      if (event === 'message' && data) fullContent += (JSON.parse(data) as { content: string }).content;
    }
  }
  return fullContent;
}

function parseJson<T>(raw: string): T {
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(clean) as T;
}

export const aiProxy = {
  async generateQuestions(payload: GenerateQuestionsPayload): Promise<InterviewQuestion[]> {
    const system = `You are an expert technical interviewer. Generate interview questions and return ONLY a valid JSON array with no other text, no markdown, no explanation.

Each element must match exactly:
{
  "id": "<uuid-v4>",
  "group": "<the group name>",
  "question": "<the question text>",
  "difficulty": "<easy|medium|hard>",
  "exampleAnswer": "<a strong 2-3 sentence example answer>",
  "evaluationCriteria": ["<criterion 1>", "<criterion 2>", "<criterion 3>"],
  "followUpQuestions": ["<follow-up 1>", "<follow-up 2>"],
  "status": "not-asked",
  "notes": ""
}

Calibrate difficulty to the seniority level. ${payload.seniority === 'junior' ? 'Prefer easy/medium.' : payload.seniority === 'lead' ? 'Prefer hard/medium.' : 'Balance easy/medium/hard.'}`;

    const modeContext = payload.mode === 'interviewer'
      ? `You are helping an interviewer assess a candidate for ${payload.jobTitle}.`
      : `You are helping a candidate practice for ${payload.jobTitle} interviews.`;

    // Generate each group in parallel so total time ≈ single-group time
    const groupResults = await Promise.all(
      payload.groups.map((group) => {
        const user = `${modeContext}

Role: ${payload.jobTitle}
Seniority: ${payload.seniority}
Job description:
${payload.jobDescription}

Generate exactly ${payload.questionsPerGroup} questions for the "${group}" group.
Every question's "group" field must be "${group}".`;

        return callTeIhi([
          { role: 'system', content: system },
          { role: 'user', content: user },
        ], 4096).then((raw) => parseJson<InterviewQuestion[]>(raw));
      }),
    );

    return groupResults.flat().map((q) => ({ ...q, id: q.id ?? uuid(), status: 'not-asked' as const, notes: q.notes ?? '' }));
  },

  async generateReport(payload: GenerateReportPayload): Promise<CandidateReport> {
    const { session } = payload;
    const asked = session.questions.filter((q) => q.status !== 'not-asked');
    const questionSummary = asked
      .map((q) => `[${q.group}] ${q.question} → ${q.status}${q.notes ? ` | Notes: ${q.notes}` : ''}`)
      .join('\n');

    const system = `You are a senior hiring manager. Analyse this interview and return ONLY a valid JSON object with no other text, no markdown.

The object must match exactly:
{
  "sessionId": "<provided session id>",
  "candidateSummary": "<2-3 sentence overview>",
  "technicalStrengths": ["<strength>", ...],
  "behaviouralStrengths": ["<strength>", ...],
  "concerns": ["<concern>", ...],
  "recommendedFollowUp": ["<action>", ...],
  "recommendation": "<strong-hire|hire|maybe|no-hire>",
  "generatedAt": "<ISO 8601 now>"
}`;

    const user = `Session ID: ${session.id}
Candidate: ${session.setup.candidateName ?? 'Unknown'}
Role: ${session.setup.jobTitle} (${session.setup.seniority})
Mode: ${session.setup.mode}

Questions reviewed (${asked.length} of ${session.questions.length}):
${questionSummary || 'No questions reviewed yet.'}`;

    const raw = await callTeIhi([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]);

    const report = parseJson<CandidateReport>(raw);
    return { ...report, sessionId: session.id, generatedAt: new Date().toISOString() };
  },
};
