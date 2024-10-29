export function useGithubState() {
  const STATE_KEY = 'github_auth_state';

  function generateState() {
    const state = Math.random().toString(36).substring(7);
    console.log('Generated state:', state);
    localStorage.setItem(STATE_KEY, state);
    return state;
  }

  function getState() {
    const state = localStorage.getItem(STATE_KEY);
    console.log('Retrieved state:', state);
    return state;
  }

  function clearState() {
    console.log('Clearing state');
    localStorage.removeItem(STATE_KEY);
  }

  function verifyState(receivedState: string) {
    const savedState = getState();
    console.log('Verifying states:', { received: receivedState, saved: savedState });
    return receivedState === savedState;
  }

  return {
    generateState,
    getState,
    clearState,
    verifyState,
  };
}
