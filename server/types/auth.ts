import type { IUser } from './user';

export interface AuthData {
  user: IUser;
  isAuthenticated: boolean;
}
