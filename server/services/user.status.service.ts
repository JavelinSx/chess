// server/services/user-status-sync.ts

import { sseManager } from '../utils/SSEManager';
import User from '../db/models/user.model';

export async function syncUserStatuses() {
  const activeUserIds = sseManager.getActiveConnections();

  // Обновляем статусы всех пользователей
  await User.updateMany({}, { isOnline: false });

  // Устанавливаем статус онлайн для активных пользователей
  if (activeUserIds.size > 0) {
    await User.updateMany({ _id: { $in: Array.from(activeUserIds) } }, { isOnline: true });
  }
}

// Запускаем синхронизацию каждые 5 минут
export function startUserStatusSync() {
  setInterval(syncUserStatuses, 1 * 60 * 1000);
}
