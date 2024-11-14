export function useGoogleState() {
  const STATE_KEY = 'google_auth_state';

  function generateState() {
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem(STATE_KEY, state);
    return state;
  }

  function getState() {
    const state = localStorage.getItem(STATE_KEY);
    return state;
  }

  function clearState() {
    localStorage.removeItem(STATE_KEY);
  }

  function verifyState(receivedState: string) {
    const savedState = getState();
    return receivedState === savedState;
  }

  return {
    generateState,
    getState,
    clearState,
    verifyState,
  };
}
