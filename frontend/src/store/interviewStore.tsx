// Global interview state — React Context + useReducer.
// Persists to localStorage via storageService; syncs to backend when available.

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import type {
  InterviewSession,
  InterviewQuestion,
  QuestionGroup,
  QuestionStatus,
  CandidateReport,
} from '@/types/interview';
import { storageService } from '@/services/storageService';
import { backendService } from '@/services/backendService';

interface StoreState {
  sessions: InterviewSession[];
  activeSessionId: string | null;
  activeReport: CandidateReport | null;
}

type Action =
  | { type: 'LOAD_SESSIONS'; sessions: InterviewSession[] }
  | { type: 'ADD_SESSION'; session: InterviewSession }
  | { type: 'UPDATE_SESSION'; session: InterviewSession }
  | { type: 'DELETE_SESSION'; id: string }
  | { type: 'SET_ACTIVE_SESSION'; id: string | null }
  | { type: 'UPDATE_QUESTION'; sessionId: string; questionId: string; updates: Partial<InterviewQuestion> }
  | { type: 'SET_QUESTION_STATUS'; sessionId: string; questionId: string; status: QuestionStatus }
  | { type: 'SET_QUESTION_NOTES'; sessionId: string; questionId: string; notes: string }
  | { type: 'ADD_QUESTION'; sessionId: string; question: InterviewQuestion }
  | { type: 'SET_ACTIVE_REPORT'; report: CandidateReport | null };

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'LOAD_SESSIONS':
      return { ...state, sessions: action.sessions };

    case 'ADD_SESSION': {
      const sessions = [action.session, ...state.sessions];
      storageService.saveSession(action.session);
      backendService.createSession(action.session).catch(console.error);
      return { ...state, sessions, activeSessionId: action.session.id };
    }

    case 'UPDATE_SESSION': {
      const sessions = state.sessions.map((s) =>
        s.id === action.session.id ? action.session : s
      );
      storageService.saveSession(action.session);
      backendService.updateSession(action.session).catch(console.error);
      return { ...state, sessions };
    }

    case 'DELETE_SESSION': {
      storageService.deleteSession(action.id);
      backendService.deleteSession(action.id).catch(console.error);
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.id !== action.id),
        activeSessionId: state.activeSessionId === action.id ? null : state.activeSessionId,
      };
    }

    case 'SET_ACTIVE_SESSION':
      return { ...state, activeSessionId: action.id };

    case 'UPDATE_QUESTION': {
      const sessions = state.sessions.map((s) => {
        if (s.id !== action.sessionId) return s;
        const updated: InterviewSession = {
          ...s,
          questions: s.questions.map((q) =>
            q.id === action.questionId ? { ...q, ...action.updates } : q
          ),
          updatedAt: new Date().toISOString(),
        };
        storageService.saveSession(updated);
        backendService.updateSession(updated).catch(console.error);
        return updated;
      });
      return { ...state, sessions };
    }

    case 'SET_QUESTION_STATUS':
      return reducer(state, {
        type: 'UPDATE_QUESTION',
        sessionId: action.sessionId,
        questionId: action.questionId,
        updates: { status: action.status },
      });

    case 'SET_QUESTION_NOTES':
      return reducer(state, {
        type: 'UPDATE_QUESTION',
        sessionId: action.sessionId,
        questionId: action.questionId,
        updates: { notes: action.notes },
      });

    case 'ADD_QUESTION': {
      const sessions = state.sessions.map((s) => {
        if (s.id !== action.sessionId) return s;
        const updated: InterviewSession = {
          ...s,
          questions: [...s.questions, action.question],
          updatedAt: new Date().toISOString(),
        };
        storageService.saveSession(updated);
        backendService.updateSession(updated).catch(console.error);
        return updated;
      });
      return { ...state, sessions };
    }

    case 'SET_ACTIVE_REPORT':
      return { ...state, activeReport: action.report };

    default:
      return state;
  }
}

interface StoreContextValue {
  state: StoreState;
  dispatch: React.Dispatch<Action>;
  activeSession: InterviewSession | null;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function createQuestion(
  group: QuestionGroup,
  question: string,
  difficulty: InterviewQuestion['difficulty'] = 'medium'
): InterviewQuestion {
  return {
    id: uuid(),
    group,
    question,
    difficulty,
    exampleAnswer: '',
    evaluationCriteria: [],
    followUpQuestions: [],
    status: 'not-asked',
    notes: '',
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    sessions: [],
    activeSessionId: null,
    activeReport: null,
  });

  useEffect(() => {
    // Load from backend if available, else localStorage
    if (backendService.isAvailable) {
      backendService.listSessions()
        .then((sessions) => dispatch({ type: 'LOAD_SESSIONS', sessions }))
        .catch(() => {
          dispatch({ type: 'LOAD_SESSIONS', sessions: storageService.getSessions() });
        });
    } else {
      dispatch({ type: 'LOAD_SESSIONS', sessions: storageService.getSessions() });
    }
  }, []);

  const activeSession = state.sessions.find((s) => s.id === state.activeSessionId) ?? null;

  return (
    <StoreContext.Provider value={{ state, dispatch, activeSession }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
