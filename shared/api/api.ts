import { $fetch, FetchError } from 'ofetch';
import type { ApiResponse } from '~/server/types/auth';

export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
  customHeaders: Record<string, string> = {}
): Promise<ApiResponse<T>> {
  const config = useRuntimeConfig();
  const url = `${config.public.apiBase}${endpoint}`;
  const headers: Record<string, string> = {
    ...customHeaders,
  };

  if (import.meta.client) {
    const token = useCookie('auth_token').value;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await $fetch<ApiResponse<T>>(url, {
      method,
      body,
      headers,
    });

    console.log('API response:', response);

    if (!response || typeof response !== 'object' || (!('data' in response) && !('error' in response))) {
      throw new Error('Invalid response structure');
    }

    return response;
  } catch (error: unknown) {
    if (error instanceof FetchError) {
      return {
        data: null,
        error: error.data?.message || error.message || 'An error occurred',
      };
    }
    if (error instanceof Error) {
      return { data: null, error: error.message };
    }
    return { data: null, error: 'An unknown error occurred' };
  }
}
