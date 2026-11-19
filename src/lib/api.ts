const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';
const TOKEN_KEY = 'crm_access_token';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const headers: Record<string, string> = { ...options.headers };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && path !== '/auth/login') {
    clearToken();
    window.location.href = '/login';
    throw new ApiError('Your session has expired. Please log in again.', 401);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(', ') : (data?.message ?? 'Something went wrong');
    throw new ApiError(message, response.status);
  }
  return data as T;
}
