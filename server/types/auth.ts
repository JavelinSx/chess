import type { IUser } from './user';
export interface AuthResponse {
  user: IUser;
  token: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
