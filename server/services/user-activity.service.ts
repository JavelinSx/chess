import User from '../db/models/user.model';
import { UserService } from './user.service';

export class UserActivityService {
  private static userActivityTimeout = new Map<string, NodeJS.Timeout>();
  private static readonly TIMEOUT_DURATION = 60000;

  private static clearTimeout(userId: string) {
    const timeout = this.userActivityTimeout.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      this.userActivityTimeout.delete(userId);
    }
  }

  static async updateUserActivity(userId: string) {
    try {
      this.clearTimeout(userId);

      const timeout = setTimeout(() => this.handleUserInactivity(userId), this.TIMEOUT_DURATION);
      this.userActivityTimeout.set(userId, timeout);
      await UserService.updateUserStatus(userId, true, false);
    } catch (error) {
      console.error('Error handling update user activity:', error);
    }
  }
  private static async handleUserInactivity(userId: string) {
    try {
      // Получаем текущий статус игры пользователя
      const user = await User.findById(userId);

      // Если пользователь в игре, не обновляем таймаут
      if (user && user.isGame) {
        return;
      }
      await UserService.updateUserStatus(userId, false, false);
    } catch (error) {
      console.error('Error handling user inactivity:', error);
    } finally {
      this.userActivityTimeout.delete(userId);
    }
  }
}
