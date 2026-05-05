// AI service abstraction — calls backend Lambda which proxies to Te Ihi.
// Falls back to mockAiService when VITE_AI_API_URL is not set.

import { mockAiService } from './mockAiService';
import type { AIService, GenerateQuestionsInput, GenerateReportInput } from '@/types/interview';

const BASE_URL = (import.meta.env.VITE_AI_API_URL as string | undefined)?.replace(/\/$/, '');

// Token is injected by AuthProvider (same as backendService)
let _idToken: string | null = null;
export function setAiAuthToken(token: string | null) { _idToken = token; }

function authHeader(): Record<string, string> {
  return _idToken ? { Authorization: `Bearer ${_idToken}` } : {};
}

const realAiService: AIService = {
  async generateQuestions(input: GenerateQuestionsInput) {
    if (!BASE_URL) throw new Error('VITE_AI_API_URL not configured');
    const res = await fetch(`${BASE_URL}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`AI API error: ${res.status}`);
    return res.json();
  },

  async generateReport(input: GenerateReportInput) {
    if (!BASE_URL) throw new Error('VITE_AI_API_URL not configured');
    const res = await fetch(`${BASE_URL}/sessions/${input.session.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ session: input.session }),
    });
    if (!res.ok) throw new Error(`AI API error: ${res.status}`);
    return res.json();
  },
};

export const aiService: AIService = BASE_URL ? realAiService : mockAiService;
