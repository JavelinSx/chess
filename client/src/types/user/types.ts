export interface IUser {
  id: string;
  username: string;
  email: string;
  token: string;
  rating?: number;
  gamesPlayed?: number;
  gamesWon?: number;
  gamesLost?: number;
  gamesDraw?: number;
  isOnline: boolean;
}
export interface IUpdateProfileData {
  username: string;
  email: string;
}
