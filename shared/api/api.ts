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

  // Добавляем токен в заголовки, если клиент
  if (import.meta.client) {
    const token = useCookie('auth_token').value;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Добавляем query-параметры
  if (queryParams) {
    const searchParams = new URLSearchParams(queryParams);
    url += `?${searchParams.toString()}`;
  }

  try {
    // Выполняем запрос через $fetch
    const response = await $fetch<ApiResponse<T>>(url, {
      method,
      body,
      headers,
    });

    // Проверяем структуру ответа
    if (!response || typeof response !== 'object' || (!('data' in response) && !('error' in response))) {
      throw new Error('Invalid response structure');
    }

    return response;
  } catch (error: unknown) {
    // Обработка ошибок
    const errorMessage = (error instanceof Error && error.message) || 'An unknown error occurred';
    return { data: null, error: errorMessage };
  }
}
