import type { iTheme } from "../types/types";
import storageService from "./storage.service";
import GAME, { LogLevel, DebugTypeEnum } from "../constants/game";
import logger from "./logger";

function setHtml(theme: iTheme) {
  const html = document.getElementsByTagName("html")[0];
  html.setAttribute(GAME.DATA_THEME, theme);
}

function getHtml() {
  const html = document.getElementsByTagName("html")[0];
  return html.getAttribute(GAME.DATA_THEME) as iTheme | null;
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
  if (getHtml() !== selectedTheme) {
    logger(
      DebugTypeEnum.SERVICE,
      LogLevel.ONE,
      "~~ updating saved theme in HTML:",
      selectedTheme,
    );
    setHtml(selectedTheme);
  }
}

const themeService = {
  set: saveTheme,
  get: storageService.getTheme,
};

export default themeService;
