import type { ClientUser, UserProfileResponse } from '../types/user';
import type { Friend } from '../types/friends';
import type { IUser } from '../types/user';
import User from '../db/models/user.model';
import { sseManager } from '~/server/utils/SSEManager';

export const profileUpdate = async (id: string, username: string, email: string): Promise<UserProfileResponse> => {
  const user = await User.findByIdAndUpdate(id, { username, email }, { new: true }).lean();

  if (!user) {
    throw new Error('User not found');
  }

  return {
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
    rating: user.rating,
    gamesPlayed: user.gamesPlayed,
    gamesWon: user.gamesWon,
    gamesLost: user.gamesLost,
    gamesDraw: user.gamesDraw,
    lastLogin: user.lastLogin,
    isOnline: user.isOnline,
    isGame: user.isGame,
    winRate: user.winRate,
    currentGameId: user.currentGameId,
    friends: user.friends,
    chatSetting: user.chatSetting,
  };
};

export const updateUserProfile = async (
  id: string,
  updateData: { username?: string; email?: string; chatSetting?: boolean }
): Promise<UserProfileResponse> => {
  const user = await User.findByIdAndUpdate(id, updateData, { new: true }).lean();

  if (!user) {
    throw new Error('User not found');
  }

  return {
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
    rating: user.rating,
    gamesPlayed: user.gamesPlayed,
    gamesWon: user.gamesWon,
    gamesLost: user.gamesLost,
    gamesDraw: user.gamesDraw,
    lastLogin: user.lastLogin,
    isOnline: user.isOnline,
    isGame: user.isGame,
    winRate: user.winRate,
    currentGameId: user.currentGameId,
    friends: user.friends,
    chatSetting: user.chatSetting,
  };
};
export const getUsersList = async (): Promise<ClientUser[]> => {
  return User.find({});
};

export const updateUserStatus = async (userId: string, isOnline: boolean, isGame: boolean): Promise<void> => {
  await User.findByIdAndUpdate(userId, { isOnline, isGame });

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
export async function getUsersCount(): Promise<number> {
  return await User.countDocuments();
}

export async function getUsersWithPagination(
  page: number,
  perPage: number
): Promise<{ users: ClientUser[]; totalCount: number }> {
  const skip = (page - 1) * perPage;
  const users = await User.find().skip(skip).limit(perPage).lean();

  const totalCount = await getUsersCount();

  // Преобразуем данные из базы в формат ClientUser
  const clientUsers: ClientUser[] = users.map((user: IUser & { _id: string }) => ({
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
    rating: user.rating,
    gamesPlayed: user.gamesPlayed,
    gamesWon: user.gamesWon,
    gamesLost: user.gamesLost,
    gamesDraw: user.gamesDraw,
    lastLogin: user.lastLogin,
    isOnline: user.isOnline,
    isGame: user.isGame,
    winRate: user.winRate,
    currentGameId: user.currentGameId,
    friends: user.friends.map((friend: any) => ({
      _id: friend._id?.toString() || friend.toString(),
      username: '',
      isOnline: false,
      isGame: false,
    })) as Friend[],
    chatSetting: user.chatSetting,
  }));

  return {
    users: clientUsers,
    totalCount,
  };
}
if (import.meta.client) {
  setInterval(syncAllUsersStatus, 6000);
}
