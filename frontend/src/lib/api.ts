const DEFAULT_LOCAL_API_BASE = 'http://localhost:3001';

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const trimmed = configured?.trim().replace(/\/$/, '');

  if (trimmed) {
    return trimmed;
  }

  if (import.meta.env.DEV) {
    return DEFAULT_LOCAL_API_BASE;
  }

  throw new Error('VITE_API_BASE_URL is required in production.');
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export function buildApiUrl(path: string): string {
  return `${getApiBaseUrl()}${normalizePath(path)}`;
}

async function readErrorMessage(response: Response): Promise<string | null> {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    const body = await response.json();
    if (body && typeof body === 'object' && 'error' in body) {
      const error = (body as { error?: unknown }).error;
      return typeof error === 'string' ? error : null;
    }
  } catch {
    return null;
  }

  return null;
}

export async function apiFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), init);

  if (!response.ok) {
    const errorMessage = await readErrorMessage(response);
    throw new Error(errorMessage || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
