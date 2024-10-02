import type { IUser } from './user';

export interface AuthData {
  user: IUser;
  token: string;
}
