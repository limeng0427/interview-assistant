// Backend API client — session CRUD + report fetch via the Lambda API.
// Falls through to storageService when VITE_AI_API_URL is not configured.

import type { InterviewSession, CandidateReport } from '@/types/interview';

const BASE_URL = (import.meta.env.VITE_AI_API_URL as string | undefined)?.replace(/\/$/, '');

// Token is set by AuthProvider after login
let _idToken: string | null = null;
export function setAuthToken(token: string | null) { _idToken = token; }

function authHeader(): Record<string, string> {
  return _idToken ? { Authorization: `Bearer ${_idToken}` } : {};
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) throw new Error('VITE_AI_API_URL not configured');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const backendService = {
  isAvailable: !!BASE_URL,

  async createSession(session: InterviewSession): Promise<InterviewSession> {
    return apiFetch<InterviewSession>('/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  },

  async getSession(id: string): Promise<InterviewSession> {
    return apiFetch<InterviewSession>(`/sessions/${id}`);
  },

  async listSessions(): Promise<InterviewSession[]> {
    return apiFetch<InterviewSession[]>('/sessions');
  },

  async updateSession(session: InterviewSession): Promise<InterviewSession> {
    return apiFetch<InterviewSession>(`/sessions/${session.id}`, {
      method: 'PUT',
      body: JSON.stringify(session),
    });
  },

  async deleteSession(id: string): Promise<void> {
    await apiFetch<unknown>(`/sessions/${id}`, { method: 'DELETE' });
  },

  async getReport(sessionId: string): Promise<CandidateReport> {
    return apiFetch<CandidateReport>(`/sessions/${sessionId}/report`);
  },
};
