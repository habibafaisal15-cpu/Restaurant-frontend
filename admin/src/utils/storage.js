const KEYS = {
  TOKEN: 'yk_admin_token',
  USER: 'yk_admin_user',
  THEME: 'yk_theme',
};

function safeParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function getJSON(key, fallback = null) {
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  return safeParse(raw, fallback);
}

export function setJSON(key, value) {
  if (value == null) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export function getToken() {
  return localStorage.getItem(KEYS.TOKEN);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(KEYS.TOKEN, token);
  } else {
    localStorage.removeItem(KEYS.TOKEN);
  }
}

export function clearToken() {
  localStorage.removeItem(KEYS.TOKEN);
}

export function getUser() {
  return getJSON(KEYS.USER);
}

export function setUser(user) {
  setJSON(KEYS.USER, user);
}

export function clearUser() {
  localStorage.removeItem(KEYS.USER);
}

export function clearAuth() {
  clearToken();
  clearUser();
}

export function getTheme() {
  return localStorage.getItem(KEYS.THEME);
}

export function setTheme(theme) {
  if (theme) {
    localStorage.setItem(KEYS.THEME, theme);
  } else {
    localStorage.removeItem(KEYS.THEME);
  }
}

export { KEYS };
