import type { IUser } from './user';
export interface LoginResponse {
  message: string;
  user: IUser;
  token: string;
}
