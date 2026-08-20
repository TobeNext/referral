import { getAccessToken } from '../auth/auth-storage';

export type ApiError = { statusCode: number; code: string; message: string; requestId: string };
export class ApiClientError extends Error { constructor(public readonly payload: ApiError) { super(payload.message); } }

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers } });
  } catch {
    throw new ApiClientError({ statusCode: 0, code: 'NETWORK_ERROR', message: '网络连接失败，请检查服务后重试', requestId: '' });
  }
  const body = await response.json().catch(() => ({ statusCode: response.status, code: 'INVALID_RESPONSE', message: '服务返回了无法识别的响应', requestId: '' }));
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login') window.dispatchEvent(new Event('auth:unauthorized'));
    throw new ApiClientError(body as ApiError);
  }
  return body as T;
}
