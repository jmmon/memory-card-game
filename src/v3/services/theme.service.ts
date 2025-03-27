import type { iTheme } from "../types/types";
import storageService from "./storage.service";

const DATA_THEME = "data-theme";

function setHtml(value: iTheme) {
  // console.log("~~ saving theme to html");
  const html = document.getElementsByTagName("html")[0];
  // console.log({
  //   html,
  //   [DATA_THEME]: html.getAttribute(DATA_THEME),
  // });
  html.setAttribute(DATA_THEME, value);
  // console.log("~~ set html theme to:", value);
}

function getHtml() {
  // console.log("~~ getting theme from html");
  const html = document.getElementsByTagName("html")[0];
  // console.log({
  //   html,
  //   [DATA_THEME]: html.getAttribute(DATA_THEME),
  // });
  return html.getAttribute(DATA_THEME) as iTheme | null;
}

function saveTheme(selectedTheme: iTheme) {
  console.log("saveTheme:", { selectedTheme });

  const storedTheme = storageService.getTheme();
  if (storedTheme !== selectedTheme) {
    console.log("~~ updating saved theme in localstorage:", selectedTheme);
    storageService.setTheme(selectedTheme);
  }
  const htmlTheme = getHtml();
  if (htmlTheme !== selectedTheme) {
    console.log("~~ updating saved theme in HTML:", selectedTheme);
    setHtml(selectedTheme);
  }
}

function getTheme() {
  const storedTheme = storageService.getTheme();
  if (storedTheme) return storedTheme;
  const htmlTheme = getHtml();
  if (htmlTheme) return htmlTheme;
  return null;
}

const themeService = {
  save: saveTheme,
  get: getTheme,
};

export default themeService;
