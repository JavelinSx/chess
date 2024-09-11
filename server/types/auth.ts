import type { ClientUser } from './user';

export interface AuthData {
  user: ClientUser;
  token: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
