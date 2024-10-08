import { $fetch, FetchError } from 'ofetch';
import type { ApiResponse } from '~/server/types/api';

export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>,
  customHeaders: Record<string, string> = {}
): Promise<ApiResponse<T>> {
  const config = useRuntimeConfig();
  const api = config.public.apiBase! || process.env.API_BASE!;
  let url = `${api}${endpoint}`;
  const headers: Record<string, string> = {
    ...customHeaders,
  };

  if (import.meta.client) {
    const token = useCookie('auth_token').value;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  if (queryParams) {
    const searchParams = new URLSearchParams(queryParams);
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await $fetch<ApiResponse<T>>(url, {
      method,
      body,
      headers,
    });

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
