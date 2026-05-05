// Cognito PKCE auth utilities. No external SDK required.

export const cognitoConfig = {
  userPoolId:  import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined,
  clientId:    import.meta.env.VITE_COGNITO_CLIENT_ID    as string | undefined,
  domain:      import.meta.env.VITE_COGNITO_DOMAIN        as string | undefined, // e.g. ia-auth-prod-123456789.auth.ap-southeast-2.amazoncognito.com
  redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
};

export const isAuthConfigured = !!(cognitoConfig.clientId && cognitoConfig.domain);

// ── PKCE helpers ────────────────────────────────────────────────────────────

function base64urlEncode(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function generatePkce() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64urlEncode(verifierBytes.buffer as ArrayBuffer);
  const challengeBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = base64urlEncode(challengeBytes);
  return { verifier, challenge };
}

export function buildLoginUrl(challenge: string, provider?: 'Google') {
  const { domain, clientId, redirectUri } = cognitoConfig;
  const params = new URLSearchParams({
    response_type:        'code',
    client_id:            clientId!,
    redirect_uri:         redirectUri,
    scope:                'email openid profile',
    code_challenge:       challenge,
    code_challenge_method:'S256',
    ...(provider ? { identity_provider: provider } : {}),
  });
  return `https://${domain}/oauth2/authorize?${params}`;
}

export async function exchangeCode(code: string, verifier: string) {
  const { domain, clientId, redirectUri } = cognitoConfig;
  const res = await fetch(`https://${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     clientId!,
      code,
      redirect_uri:  redirectUri,
      code_verifier: verifier,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json() as Promise<TokenResponse>;
}

export async function refreshIdToken(refreshToken: string) {
  const { domain, clientId } = cognitoConfig;
  const res = await fetch(`https://${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     clientId!,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed`);
  return res.json() as Promise<Omit<TokenResponse, 'refresh_token'>>;
}

export function buildLogoutUrl() {
  const { domain, clientId, redirectUri } = cognitoConfig;
  const params = new URLSearchParams({ client_id: clientId!, logout_uri: redirectUri });
  return `https://${domain}/logout?${params}`;
}

export interface TokenResponse {
  id_token:      string;
  access_token:  string;
  refresh_token: string;
  expires_in:    number;
}

export interface CognitoUser {
  sub:          string;
  email:        string;
  given_name?:  string;
  family_name?: string;
  name?:        string;
}

export function parseJwt(token: string): CognitoUser {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64).split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  );
  return JSON.parse(json) as CognitoUser;
}
