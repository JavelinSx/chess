import { API_BASE_URL } from '~/config/api';
import { useCookie } from 'nuxt/app';
export interface ApiResponse<T> {
  data: T | null;
  error?: string;
  token?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
  customHeaders: Record<string, string> = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const token = useCookie('token').value; // Используем useCookie вместо localStorage
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include', // Добавьте эту строку
  };

  try {
    const response = await fetch(url, config);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'An error occurred');
    }

    return { data: responseData as T };
  } catch (error) {
    if (error instanceof Error) {
      return { data: null, error: error.message };
    }
    return { data: null, error: 'An unknown error occurred' };
  }
}
