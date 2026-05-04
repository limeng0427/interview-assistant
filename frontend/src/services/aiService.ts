// AI service abstraction layer.
// Swap the active implementation here to switch from mock to real API.
//
// To connect a real AI API:
//   1. Create `realAiService.ts` implementing the AIService interface
//   2. Set VITE_AI_API_URL and VITE_AI_API_KEY in your .env
//   3. Change the export below to use realAiService

import { mockAiService } from './mockAiService';
import type { AIService, GenerateQuestionsInput, GenerateReportInput } from '@/types/interview';

const API_URL = import.meta.env.VITE_AI_API_URL as string | undefined;
const API_KEY = import.meta.env.VITE_AI_API_KEY as string | undefined;

// Real API implementation — activated when env vars are set
const realAiService: AIService = {
  async generateQuestions(input: GenerateQuestionsInput) {
    if (!API_URL || !API_KEY) throw new Error('AI API not configured');
    const res = await fetch(`${API_URL}/generate-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`AI API error: ${res.status}`);
    return res.json();
  },

  async generateReport(input: GenerateReportInput) {
    if (!API_URL || !API_KEY) throw new Error('AI API not configured');
    const res = await fetch(`${API_URL}/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`AI API error: ${res.status}`);
    return res.json();
  },
};

// Use real service if env vars are present, otherwise mock
export const aiService: AIService =
  API_URL && API_KEY ? realAiService : mockAiService;
