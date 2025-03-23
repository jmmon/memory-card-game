type iTheme = "light" | "dark";

function save(key: string, value: string) {
  localStorage.setItem(key, value);
  document.getElementsByTagName("html")[0].setAttribute("data-" + key, value);
}
function get(key: string) {
  return localStorage.getItem(key);
}
function saveTheme(value: iTheme) {
  save("theme", value);
}
function getTheme() {
  return get("theme") as iTheme | null;
}
const storageService = {
  save,
  get,
  saveTheme,
  getTheme,
};

export default storageService;
