// useAlert.ts
import { ref, watchEffect } from 'vue';

export type AlertType = 'info' | 'success' | 'error' | null;

interface AlertState {
  type: AlertType;
  message: string;
}

export function useAlert(timeout = 5000) {
  const alert = ref<AlertState>({ type: null, message: '' });

  const setAlert = (type: AlertType, message: string) => {
    alert.value = { type, message };
  };

  const clearAlert = () => {
    alert.value = { type: null, message: '' };
  };

  watchEffect((onCleanup) => {
    if (alert.value.type) {
      const timer = setTimeout(clearAlert, timeout);
      onCleanup(() => clearTimeout(timer));
    }
  });

  return {
    alert,
    setAlert,
    clearAlert,
  };
}
