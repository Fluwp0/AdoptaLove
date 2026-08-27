const TOKEN_KEY = 'adoptalove_token';
const USER_KEY = 'adoptalove_user';
const SESSION_EVENT = 'adoptalove-session-changed';

let fallbackToken = null;
let fallbackUser = null;

function getLocalStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (_error) {
    return null;
  }
}

function notifySessionChanged() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.dispatchEvent(new Event(SESSION_EVENT));
  } catch (_error) {
    // Session state is still available even if custom events are blocked.
  }
}

export function getToken() {
  const storage = getLocalStorage();

  if (!storage) {
    return fallbackToken;
  }

  try {
    return storage.getItem(TOKEN_KEY) || fallbackToken;
  } catch (_error) {
    return fallbackToken;
  }
}

export function getCurrentUser() {
  const storage = getLocalStorage();
  let rawUser = null;

  if (storage) {
    try {
      rawUser = storage.getItem(USER_KEY);
    } catch (_error) {
      return fallbackUser;
    }
  }

  if (!rawUser) {
    return fallbackUser;
  }

  try {
    const parsedUser = JSON.parse(rawUser);
    fallbackUser = parsedUser;
    return parsedUser;
  } catch (_error) {
    clearSession();
    return null;
  }
}

export function saveSession(token, user) {
  fallbackToken = token || null;
  fallbackUser = user || null;

  const storage = getLocalStorage();

  if (storage) {
    try {
      storage.setItem(TOKEN_KEY, token);
      storage.setItem(USER_KEY, JSON.stringify(user));
    } catch (_error) {
      // Keep the session in memory when persistent browser storage is unavailable.
    }
  }

  notifySessionChanged();
}

export function clearSession() {
  fallbackToken = null;
  fallbackUser = null;

  const storage = getLocalStorage();

  if (storage) {
    try {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
    } catch (_error) {
      // Clearing the in-memory fallback is enough if browser storage is unavailable.
    }
  }

  notifySessionChanged();
}

export function isAuthenticated() {
  return Boolean(getToken() && getCurrentUser()?.id);
}

export function onSessionChange(callback) {
  if (typeof window === 'undefined') {
    return () => {};
  }

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
