// composables/useHeartbeat.ts
import { ref, onMounted, onUnmounted } from 'vue';

// composables/useHeartbeat.ts
export function useHeartbeat() {
  const heartbeatInterval = ref<NodeJS.Timeout | null>(null);
  const HEARTBEAT_INTERVAL = 30000;

  const startHeartbeat = async () => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value);
    }

    try {
      await $fetch('/api/user/heartbeat', { method: 'POST' });

      heartbeatInterval.value = setInterval(async () => {
        try {
          await $fetch('/api/user/heartbeat', { method: 'POST' });
        } catch (error) {
          stopHeartbeat();
          console.error('Failed to send heartbeat:', error);
        }
      }, HEARTBEAT_INTERVAL);
    } catch (error) {
      console.error('Failed to send initial heartbeat:', error);
    }
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value);
      heartbeatInterval.value = null;
    }
  };

  return {
    startHeartbeat,
    stopHeartbeat,
  };
}
