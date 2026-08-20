export type ApiError = { statusCode: number; code: string; message: string; requestId: string };
export class ApiClientError extends Error { constructor(public readonly payload: ApiError) { super(payload.message); } }

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const body = await response.json();
  if (!response.ok) throw new ApiClientError(body as ApiError);
  return body as T;
}
