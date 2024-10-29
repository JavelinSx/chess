// types/github.ts

// Ответ от GitHub API с информацией о почте
export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

// Основная информация о пользователе GitHub
export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  location: string | null;
}

// Ответ с токеном доступа
export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

// Состояние GitHub аутентификации
export interface GitHubAuthState {
  isLoading: boolean;
  error: string | null;
  state: string | null; // для OAuth state verification
}
