// utils/authStorage.js

const USER_KEY = "user";

export function getStoredUser() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function hasStoredUser() {
  return !!getStoredUser();
}

export function setStoredUser(user) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user ?? null));
  } catch {}
}

export function clearStoredUser() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(USER_KEY);
  } catch {}
}
