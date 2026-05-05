import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import React from 'react';
import {
  isAuthConfigured, generatePkce, buildLoginUrl, buildLogoutUrl,
  exchangeCode, refreshIdToken, parseJwt,
  type CognitoUser, type TokenResponse,
} from '@/auth';
import { setAuthToken } from '@/services/backendService';
import { setAiAuthToken } from '@/services/aiService';

const STORAGE_KEY = 'ia:auth';

interface StoredAuth {
  idToken:      string;
  accessToken:  string;
  refreshToken: string;
  expiresAt:    number; // unix ms
}

function loadStored(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

function storeTokens(t: TokenResponse) {
  const stored: StoredAuth = {
    idToken:     t.id_token,
    accessToken: t.access_token,
    refreshToken:t.refresh_token,
    expiresAt:   Date.now() + t.expires_in * 1000 - 60_000, // 1-min buffer
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  setAuthToken(t.id_token);
  setAiAuthToken(t.id_token);
  return stored;
}

function clearStored() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem('ia:pkce_verifier');
  setAuthToken(null);
  setAiAuthToken(null);
}

export interface AuthState {
  user:      CognitoUser | null;
  idToken:   string | null;
  isLoading: boolean;
  isAuthed:  boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail:  () => Promise<void>;
  logout:    () => void;
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useState<StoredAuth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle OAuth callback (code in URL)
  useEffect(() => {
    if (!isAuthConfigured) { setIsLoading(false); return; }

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      const verifier = sessionStorage.getItem('ia:pkce_verifier');
      if (!verifier) { setIsLoading(false); return; }

      // Clean URL before exchange so refresh doesn't re-trigger
      window.history.replaceState({}, '', window.location.pathname);

      exchangeCode(code, verifier)
        .then((t) => { setStored(storeTokens(t)); })
        .catch(console.error)
        .finally(() => setIsLoading(false));
      return;
    }

    const s = loadStored();
    if (s) {
      if (Date.now() < s.expiresAt) {
        setAuthToken(s.idToken);
        setAiAuthToken(s.idToken);
        setStored(s);
        setIsLoading(false);
      } else {
        // Try silent refresh
        refreshIdToken(s.refreshToken)
          .then((t) => setStored(storeTokens({ ...t, refresh_token: s.refreshToken })))
          .catch(() => { clearStored(); })
          .finally(() => setIsLoading(false));
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const loginWithProvider = useCallback(async (provider?: 'Google') => {
    const { verifier, challenge } = await generatePkce();
    sessionStorage.setItem('ia:pkce_verifier', verifier);
    window.location.href = buildLoginUrl(challenge, provider);
  }, []);

  const logout = useCallback(() => {
    clearStored();
    setStored(null);
    window.location.href = buildLogoutUrl();
  }, []);

  const user = stored ? parseJwt(stored.idToken) : null;

  const value: AuthState = {
    user,
    idToken:    stored?.idToken ?? null,
    isLoading,
    isAuthed:   !!stored,
    loginWithGoogle: () => loginWithProvider('Google'),
    loginWithEmail:  () => loginWithProvider(),
    logout,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}
