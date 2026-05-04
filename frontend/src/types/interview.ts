// Core domain types for Interview Assistant

export type InterviewMode = 'interviewer' | 'interviewee';

export type SeniorityLevel = 'junior' | 'intermediate' | 'senior' | 'lead';

export type QuestionGroup =
  | 'technical'
  | 'system-design'
  | 'behavioural'
  | 'leadership'
  | 'communication'
  | 'culture-fit'
  | 'problem-solving'
  | 'domain-knowledge';

export type QuestionStatus =
  | 'not-asked'
  | 'asked'
  | 'good'
  | 'partial'
  | 'poor'
  | 'follow-up';

export type OverallRecommendation = 'strong-hire' | 'hire' | 'maybe' | 'no-hire';

export interface QuestionGroupMeta {
  id: QuestionGroup;
  label: string;
  description: string;
  icon: string;
}

export interface InterviewSetup {
  mode: InterviewMode;
  jobTitle: string;
  jobDescription: string;
  seniority: SeniorityLevel;
  selectedGroups: QuestionGroup[];
  questionsPerGroup: number;
  candidateName?: string;
}

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

export interface InterviewSession {
  id: string;
  setup: InterviewSetup;
  questions: InterviewQuestion[];
  createdAt: string;
  updatedAt: string;
  reportId?: string;
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

// AI service input/output shapes — used by both mock and real implementations
export interface GenerateQuestionsInput {
  mode: InterviewMode;
  jobTitle: string;
  jobDescription: string;
  seniority: SeniorityLevel;
  groups: QuestionGroup[];
  questionsPerGroup: number;
}

export interface GenerateReportInput {
  session: InterviewSession;
}

export interface AIService {
  generateQuestions(input: GenerateQuestionsInput): Promise<InterviewQuestion[]>;
  generateReport(input: GenerateReportInput): Promise<CandidateReport>;
}
