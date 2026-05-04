// AI proxy service — calls the custom API gateway.
// Set AI_API_URL and AI_API_KEY in Lambda environment variables.
// Replace this with the Claude/OpenAI SDK when ready.

const AI_API_URL = process.env.AI_API_URL;
const AI_API_KEY = process.env.AI_API_KEY;

interface GenerateQuestionsPayload {
  mode: string;
  jobTitle: string;
  jobDescription: string;
  seniority: string;
  groups: string[];
  questionsPerGroup: number;
}

interface GenerateReportPayload {
  session: Record<string, unknown>;
}

async function callAI<T>(path: string, body: unknown): Promise<T> {
  if (!AI_API_URL || !AI_API_KEY) {
    throw new Error('AI_API_URL and AI_API_KEY must be set in Lambda environment');
  }
  const res = await fetch(`${AI_API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': AI_API_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const aiProxy = {
  generateQuestions: (payload: GenerateQuestionsPayload) =>
    callAI<unknown[]>('/generate-questions', payload),

  generateReport: (payload: GenerateReportPayload) =>
    callAI<Record<string, unknown>>('/generate-report', payload),
};
