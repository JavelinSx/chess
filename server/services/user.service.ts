import type { UserProfileResponse } from '../types/user';
import type { IUser } from '../types/user';
import User from '../db/models/user.model';
import { sseManager } from '~/server/utils/SSEManager';

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

  await sseManager.sendUserStatusUpdate(userId, { isOnline, isGame });

  // Обновляем список пользователей для всех
  const users = await getUsersList();
  await sseManager.broadcastUserListUpdate(users);
};

export async function updateUserStats(userId: string, result: 'win' | 'loss' | 'draw') {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.gamesPlayed += 1;
  if (result === 'win') {
    user.gamesWon += 1;
  } else if (result === 'loss') {
    user.gamesLost += 1;
  } else {
    user.gamesDraw += 1;
  }
  user.winRate = user.gamesWon / user.gamesPlayed;
  user.isGame = false;

  await user.save();

  // Отправляем обновление статистики пользователю
  await sseManager.sendUserStatusUpdate(userId, {
    isOnline: user.isOnline,
    isGame: user.isGame,
  });

  // Обновляем список пользователей для всех
  const users = await getUsersList();
  await sseManager.broadcastUserListUpdate(users);
}

export const getUserById = async (userId: string): Promise<IUser | null> => {
  return User.findById(userId);
};

export async function syncAllUsersStatus() {
  const users = await User.find({});
  for (const user of users) {
    const isOnline = sseManager.isUserConnected(user._id.toString());
    if (user.isOnline !== isOnline) {
      user.isOnline = isOnline;
      await user.save();
      await updateUserStatus(user._id.toString(), isOnline, user.isGame);
    }
  }
}

if (import.meta.client) {
  setInterval(syncAllUsersStatus, 6000);
}
