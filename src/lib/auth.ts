export async function hashPassword(username: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(username.toLowerCase() + ':' + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const CURRENT_USER_KEY = 'la2-current-user';

export function getStoredUser(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function setStoredUser(username: string | null): void {
  if (typeof window === 'undefined') return;
  if (username) {
    localStorage.setItem(CURRENT_USER_KEY, username);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}
