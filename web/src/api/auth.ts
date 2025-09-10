import type { Member } from '../state/auth.store';

const API_BASE = 'https://api-exif-frame.yuru.cam';

interface AuthSuccessResponse {
  success: true;
  token: string;
  member: Member;
}

interface AuthErrorResponse {
  success: false;
  error: string;
}

export async function loginApi(email: string, password: string): Promise<AuthSuccessResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = (await res.json()) as AuthSuccessResponse | AuthErrorResponse;
  if (!res.ok || (data as AuthErrorResponse).success === false) {
    const message = (data as AuthErrorResponse).error || 'Login failed';
    throw new Error(message);
  }
  return data as AuthSuccessResponse;
}

export async function registerApi(email: string, password: string, nickname: string): Promise<AuthSuccessResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nickname }),
  });

  const data = (await res.json()) as AuthSuccessResponse | AuthErrorResponse;
  if (!res.ok || (data as AuthErrorResponse).success === false) {
    const message = (data as AuthErrorResponse).error || 'Register failed';
    throw new Error(message);
  }
  return data as AuthSuccessResponse;
}

