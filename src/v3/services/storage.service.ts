import GAME from "../constants/game";
import type { iTheme } from "../types/types";

function set(key: string, value: string) {
  localStorage.setItem(key, value);
}
function get<T>(key: string) {
  return localStorage.getItem(key) as T;
}

function setTheme(value: iTheme) {
  set(GAME.STORAGE_KEY_THEME, value);
}
function getTheme() {
  return get<iTheme | null>(GAME.STORAGE_KEY_THEME);
}

function setBrightness(value: number) {
  set(GAME.STORAGE_KEY_BRIGHTNESS, value.toString());
}
function getBrightness() {
  return get<number | null>(GAME.STORAGE_KEY_BRIGHTNESS);
}

const storageService = {
  get,
  set,
  getTheme,
  setTheme,
  getBrightness,
  setBrightness,
};

export default storageService;
