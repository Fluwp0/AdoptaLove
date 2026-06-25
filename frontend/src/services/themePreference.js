const THEME_STORAGE_KEY = 'adoptalove_theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

function normalizeTheme(theme) {
  return theme === DARK_THEME ? DARK_THEME : LIGHT_THEME;
}

export function getStoredTheme() {
  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch (_error) {
    return LIGHT_THEME;
  }
}

export function applyTheme(theme) {
  const normalizedTheme = normalizeTheme(theme);

  document.documentElement.dataset.theme = normalizedTheme;
  document.documentElement.style.colorScheme = normalizedTheme;

  return normalizedTheme;
}

export function saveTheme(theme) {
  const normalizedTheme = applyTheme(theme);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  } catch (_error) {
    // The theme can still apply for the current page if storage is unavailable.
  }

  return normalizedTheme;
}

export function applyStoredTheme() {
  return applyTheme(getStoredTheme());
}

export { DARK_THEME, LIGHT_THEME, THEME_STORAGE_KEY };
