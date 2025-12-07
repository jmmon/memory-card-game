import GAME from "../constants/game";
import type { iTheme } from "../types/types";

/**
 * Set item into localStorage
 * */
function set(key: string, value: string) {
  localStorage.setItem(key, value);
}
/**
 * Get item from localStorage
 * */
function get<T>(key: string) {
  return localStorage.getItem(key) as T;
}
/**
 * Set item as JSON into localStorage
 * */
function setJson(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}
/**
 * Get JSON item from localStorage and parse
 * */
function getJson<T>(key: string) {
  const value = localStorage.getItem(key);
  if (value === null) return null;
  try {
    return JSON.parse(value) as T;
  } catch (err) {
    console.error("Error loading json from localStorage:", err);
    return null;
  }
}

/**
 * Set theme into localStorage
 * */
function setTheme(value: iTheme) {
  set(GAME.STORAGE_KEY_THEME, value);
}
/**
 * Get theme from localStorage
 * */
function getTheme() {
  return get<iTheme | null>(GAME.STORAGE_KEY_THEME);
}

const storageService = {
  set,
  get,
  setJson,
  getJson,
  setTheme,
  getTheme,
};

export default storageService;
