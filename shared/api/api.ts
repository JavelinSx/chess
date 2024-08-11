import type { IUser } from '~/server/types/user';

const API_BASE_URL = '/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function apiRequest<T>(endpoint: string, method: HttpMethod = 'GET', body?: object): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    const response: Response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData: { message?: string } = await response.json();
      throw new Error(errorData.message || 'Request failed');
    }

    const data: T = await response.json();
    return { data };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'An unexpected error occurred' };
  }
}

interface AuthResponse {
  user: IUser;
  token: string;
}

export const authApi = {
  register: (email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/register', 'POST', { email, password }),

  login: (email: string, password: string) => apiRequest<AuthResponse>('/auth/login', 'POST', { email, password }),

  logout: () => apiRequest<void>('/auth/logout', 'POST'),
};

export const userApi = {
  getProfile: () => apiRequest<IUser>('/user/profile'),
  updateProfile: (userData: Partial<IUser>) => apiRequest<IUser>('/user/profile', 'PUT', userData),
};
