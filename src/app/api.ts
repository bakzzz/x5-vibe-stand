const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as T;
}

export const standApi = {
  projects: {
    list: (params?: { author?: string; includeArchived?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.author) q.set('author', params.author);
      if (params?.includeArchived) q.set('includeArchived', '1');
      const qs = q.toString();
      return request<import('@/lib/project').StandProject[]>(`/projects${qs ? `?${qs}` : ''}`);
    },
    get: (slug: string) => request<import('@/lib/project').StandProject>(`/projects/${slug}`),
    create: (body: Record<string, unknown>) =>
      request<import('@/lib/project').StandProject>('/projects', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    import: (body: Record<string, unknown>) =>
      request<import('@/lib/project').StandProject>('/projects/import', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (slug: string, body: Record<string, unknown>) =>
      request<import('@/lib/project').StandProject>(`/projects/${slug}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    delete: (slug: string) =>
      request<{ deleted: boolean }>(`/projects/${slug}`, { method: 'DELETE' }),
    sync: (slug: string) =>
      request<import('@/lib/project').StandProject & { sync: { ok: boolean; message: string; commit?: string | null } }>(
        `/projects/${slug}/sync`,
        { method: 'POST' },
      ),
    requirements: (slug: string) =>
      request<{ found: boolean; path: string | null; content: string | null }>(
        `/projects/${slug}/requirements`,
      ),
  },
  settings: {
    get: (key: string) =>
      request<{ key: string; value: string; updatedAt?: string }>(`/settings/${encodeURIComponent(key)}`),
    put: (key: string, value: string) =>
      request<{ key: string; value: string; updatedAt?: string }>(`/settings/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      }),
  },
  remarks: {
    list: (projectId: string) =>
      request<Array<{ id: string; content: string; author: string; status: string; createdAt: string }>>(
        `/remarks?projectId=${encodeURIComponent(projectId)}`,
      ),
    create: (body: {
      projectId: string;
      content: string;
      author?: string;
      targetRef?: string;
      targetType?: string;
    }) => request('/remarks', { method: 'POST', body: JSON.stringify(body) }),
  },
};
