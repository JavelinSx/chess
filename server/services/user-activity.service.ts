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
      await User.findByIdAndUpdate(userId, {
        lastActive: new Date(),
        isOnline: true,
      });
    } catch (error) {
      throw error; // Пробрасываем ошибку дальше
    }
  }
  private static async handleUserInactivity(userId: string) {
    try {
      await UserService.updateUserStatus(userId, false, false);
      await sseManager.broadcastUserStatusUpdate(userId, {
        isOnline: false,
        isGame: false,
      });
    } catch (error) {
      console.error('Error handling user inactivity:', error);
    } finally {
      this.userActivityTimeout.delete(userId);
    }
  }
}
