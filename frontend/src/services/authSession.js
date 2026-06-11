const TOKEN_KEY = 'adoptalove_token';
const USER_KEY = 'adoptalove_user';
const SESSION_EVENT = 'adoptalove-session-changed';

function notifySessionChanged() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  const rawUser = window.localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (_error) {
    clearSession();
    return null;
  }
}

export function saveSession(token, user) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  notifySessionChanged();
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  notifySessionChanged();
}

export function isAuthenticated() {
  return Boolean(getToken() && getCurrentUser()?.id);
}

export function onSessionChange(callback) {
  function handleChange() {
    callback(getCurrentUser());
  }

  window.addEventListener(SESSION_EVENT, handleChange);
  window.addEventListener('storage', handleChange);

  return () => {
    window.removeEventListener(SESSION_EVENT, handleChange);
    window.removeEventListener('storage', handleChange);
  };
}
