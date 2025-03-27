import type { iTheme } from "../types/types";
import storageService from "./storage.service";
import GAME, { LogLevel, DebugTypeEnum } from "../constants/game";
import logger from "./logger";

function setHtml(theme: iTheme) {
  const html = document.getElementsByTagName("html")[0];
  html.setAttribute("data-" + GAME.STORAGE_KEY_THEME, theme);
}
function setHtmlBrightness(value: number) {
  const html = document.getElementsByTagName("html")[0];
  html.setAttribute("data-" + GAME.STORAGE_KEY_BRIGHTNESS, value.toString());
}

function getHtmlTheme() {
  const html = document.getElementsByTagName("html")[0];
  return html.getAttribute("data-" + GAME.STORAGE_KEY_THEME) as iTheme | null;
}
function getHtmlBrightness() {
  const html = document.getElementsByTagName("html")[0];
  return html.getAttribute("data-" + GAME.STORAGE_KEY_BRIGHTNESS) as
    | number
    | null;
}

function saveTheme(selectedTheme: iTheme) {
  logger(DebugTypeEnum.SERVICE, LogLevel.ONE, "themeService.set():", {
    selectedTheme,
  });

  if (storageService.getTheme() !== selectedTheme) {
    logger(
      DebugTypeEnum.SERVICE,
      LogLevel.ONE,
      "~~ updating saved theme in localstorage:",
      selectedTheme,
    );
    storageService.setTheme(selectedTheme);
  }
  if (getHtmlTheme() !== selectedTheme) {
    logger(
      DebugTypeEnum.SERVICE,
      LogLevel.ONE,
      "~~ updating saved theme in HTML:",
      selectedTheme,
    );
    setHtmlTheme(selectedTheme);
  }
}

function saveBrightness(brightness: number) {
  logger(DebugTypeEnum.SERVICE, LogLevel.ONE, "themeService.setBrightness():", {
    brightness,
  });

  if (storageService.getBrightness() !== brightness) {
    logger(
      DebugTypeEnum.SERVICE,
      LogLevel.ONE,
      "~~ updating saved brightness in localstorage:",
      brightness,
    );
    storageService.setBrightness(brightness);
  }
  if (getHtmlBrightness() !== brightness) {
    logger(
      DebugTypeEnum.SERVICE,
      LogLevel.ONE,
      "~~ updating saved brightness in HTML:",
      brightness,
    );
    setHtmlBrightness(brightness);
  }
}

const themeService = {
  get: storageService.getTheme,
  set: saveTheme,
  getBrightness: storageService.getBrightness,
  setBrightness: saveBrightness,
};

export default themeService;
