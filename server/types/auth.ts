import type { ClientUser, IUser } from './user';

export interface AuthData {
  user: IUser | ClientUser;
  isAuthenticated: boolean;
}
