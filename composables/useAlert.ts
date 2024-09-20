import { ref, watchEffect } from 'vue';

export type AlertType = 'info' | 'success' | 'error' | null;

interface AlertState {
  type: AlertType;
  message: string;
}

export function useAlert(timeout = 10000) {
  const alert = ref<AlertState>({ type: null, message: '' });
  let timer: number | null = null;

  const setAlert = (type: AlertType, message: string) => {
    clearTimeout(timer as number);
    alert.value = { type, message };
    startTimer();
  };

  const clearAlert = () => {
    alert.value = { type: null, message: '' };
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const startTimer = () => {
    timer = setTimeout(clearAlert, timeout) as unknown as number;
  };

  const forceCloseAlert = () => {
    clearAlert();
  };

  watchEffect((onCleanup) => {
    if (alert.value.type) {
      startTimer();
      onCleanup(() => {
        if (timer) {
          clearTimeout(timer);
        }
      });
    }
  });

  return {
    alert,
    setAlert,
    clearAlert,
    forceCloseAlert,
  };
}
