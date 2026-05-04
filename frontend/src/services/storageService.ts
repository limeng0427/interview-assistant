// Persists interview sessions to localStorage so work survives page refresh.

import type { InterviewSession, CandidateReport } from '@/types/interview';

const SESSIONS_KEY = 'ia_sessions';
const REPORTS_KEY = 'ia_reports';

export const storageService = {
  getSessions(): InterviewSession[] {
    try {
      return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
    } catch {
      return [];
    }
  },

  saveSession(session: InterviewSession): void {
    const sessions = this.getSessions().filter((s) => s.id !== session.id);
    sessions.unshift({ ...session, updatedAt: new Date().toISOString() });
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, 20)));
  },

  deleteSession(id: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== id);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  },

  getReports(): CandidateReport[] {
    try {
      return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
    } catch {
      return [];
    }
  },

  saveReport(report: CandidateReport): void {
    const reports = this.getReports().filter((r) => r.sessionId !== report.sessionId);
    reports.unshift(report);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports.slice(0, 20)));
  },

  getReportForSession(sessionId: string): CandidateReport | undefined {
    return this.getReports().find((r) => r.sessionId === sessionId);
  },
};
