// Stores the JWT for the signed-in user. localStorage is a placeholder for secure
// device storage (for example Capacitor Preferences or Keychain) before release.
const TOKEN_KEY = 'bishi.token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable: the user stays signed in for this session only.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clear.
  }
}
