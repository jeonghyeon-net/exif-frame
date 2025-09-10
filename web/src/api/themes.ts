/* eslint-disable @typescript-eslint/no-explicit-any */

const API_BASE = 'https://api-exif-frame.yuru.cam';

export interface ThemeRecord {
  id: number;
  ownerMemberId: number;
  title: string;
  description?: string | null;
  previewImageUrl?: string | null;
  svg?: string | null;
  assets?: string | null; // JSON string
  downloadCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface ThemeListResponse {
  success: boolean;
  page: number;
  pageSize: number;
  total: number;
  themes: ThemeRecord[];
}

export async function fetchTheme(id: number): Promise<{ success: boolean; theme: ThemeRecord }> {
  const res = await fetch(`${API_BASE}/api/themes/${id}`);
  if (!res.ok) throw new Error('Failed to fetch theme');
  return (await res.json()) as { success: boolean; theme: ThemeRecord };
}

export async function fetchMyThemes(token: string, params?: { page?: number; pageSize?: number; title?: string }): Promise<ThemeListResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.pageSize) search.set('pageSize', String(params.pageSize));
  if (params?.title) search.set('title', params.title);
  const res = await fetch(`${API_BASE}/api/my/themes${search.toString() ? `?${search.toString()}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load themes');
  return (await res.json()) as ThemeListResponse;
}

export async function createTheme(token: string, body: { title: string; description?: string; svg?: string; assets?: string; previewImageUrl?: string }): Promise<{ success: boolean; id: number }> {
  const res = await fetch(`${API_BASE}/api/my/themes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as any;
  if (!res.ok || data?.success !== true) {
    throw new Error(data?.error || 'Failed to create theme');
  }
  return data as { success: boolean; id: number };
}

export async function updateTheme(
  token: string,
  id: number,
  body: Partial<{ title: string; description: string; svg: string; assets: string; previewImageUrl: string }>
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/themes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as any;
  if (!res.ok || data?.success !== true) {
    throw new Error(data?.error || 'Failed to update theme');
  }
  return data as { success: boolean };
}

export async function uploadThemePreview(token: string, id: number, file: File): Promise<{ success: boolean; url: string }> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const res = await fetch(`${API_BASE}/api/themes/${id}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'image/jpeg', Authorization: `Bearer ${token}` },
    body: buf,
  });
  const data = (await res.json()) as any;
  if (!res.ok || data?.success !== true) {
    throw new Error(data?.error || 'Failed to upload preview');
  }
  return data as { success: boolean; url: string };
}

export async function deleteTheme(token: string, id: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/themes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as any;
  if (!res.ok || data?.success !== true) {
    throw new Error(data?.error || 'Failed to delete theme');
  }
  return data as { success: boolean };
}
