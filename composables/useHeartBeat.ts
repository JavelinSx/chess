// composables/useHeartbeat.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useHeartbeat() {
  const heartbeatInterval = ref<NodeJS.Timeout | null>(null);
  const HEARTBEAT_INTERVAL = 30000;

  const startHeartbeat = async () => {
    // Очищаем существующий интервал если есть
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value);
    }

    // Отправляем первый heartbeat сразу
    try {
      await $fetch('/api/user/heartbeat', { method: 'POST' });
    } catch (error) {
      console.error('Failed to send initial heartbeat:', error);
    }

    heartbeatInterval.value = setInterval(async () => {
      try {
        await $fetch('/api/user/heartbeat', {
          method: 'POST',
        });
      } catch (error) {
        stopHeartbeat();
        console.error('Failed to send heartbeat:', error);
      }
    }, HEARTBEAT_INTERVAL);
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value);
      heartbeatInterval.value = null;
    }
  };

  onMounted(() => {
    startHeartbeat();
  });

  onUnmounted(() => {
    stopHeartbeat();
  });

  return {
    startHeartbeat,
    stopHeartbeat,
  };
}
