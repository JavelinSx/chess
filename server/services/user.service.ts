import type { UserProfileResponse } from '../types/user';
import type { IUser } from '../types/user';
import User from '../db/models/user.model';
import { sendStatusUpdate } from '../api/sse/user-status';
export const profileUpdate = async (id: string, username: string, email: string): Promise<UserProfileResponse> => {
  const user = await User.findByIdAndUpdate(id, { username, email }, { new: true });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    username: user.username,
    email: user.email,
  };
};
export const getUsersList = async (): Promise<IUser[]> => {
  return User.find({}, 'username isOnline isGame');
};
export const updateUserStatus = async (userId: string, isOnline: boolean, isGame: boolean): Promise<void> => {
  console.log('Updating user status in database');
  await User.findByIdAndUpdate(userId, { isOnline, isGame });
  console.log('User status updated in database');
};

export const getUserById = async (userId: string): Promise<IUser | null> => {
  return User.findById(userId);
};
