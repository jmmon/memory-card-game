// import { useVisibleTask$ } from "@builder.io/qwik";
// import type { Signal } from "@builder.io/qwik";
// import type { iTheme, iUserSettings } from "../types/types";
// import themeService from "../services/theme.service";
// import logger from "../services/logger";
//
// // supposed to update theme based on settings, but also
// // needs to take savedTheme and if it exists then do the inverse:
// // update settings based on savedTheme
// const useSyncThemeWithUserSettingsSignal = (
//   userSettings: Signal<iUserSettings>,
//   savedTheme?: Signal<iTheme | null>,
// ) => {
//   // eslint-disable-next-line qwik/no-use-visible-task
//   useVisibleTask$(({ track }) => {
//     logger("HOOKS", "useSyncThemeWithUserSettingsSignal");
//     const isInvertedFromSettings = track(
//       () => userSettings.value.interface.invertCardColors,
//     );
//     const themeFromLocalStorage = track(() => savedTheme?.value);
//
//     // have a saved theme, so use this as source of truth to update settings and save theme
//     if (themeFromLocalStorage) {
//       logger("HOOKS", "~~ syncing theme from localstorage:", {
//         theme: themeFromLocalStorage,
//       });
//       const invertedFromSavedTheme = themeFromLocalStorage === "dark";
//       if (
//         userSettings.value.interface.invertCardColors !== invertedFromSavedTheme
//       ) {
//         logger("HOOKS", "~~ different; updating settings to theme:", {
//           theme: themeFromLocalStorage,
//         });
//         userSettings.value.interface.invertCardColors = invertedFromSavedTheme;
//       }
//       return;
//     }
//
//     const theme = isInvertedFromSettings ? "dark" : "light";
//     logger("HOOKS", "~~ using settings to set theme:", { theme });
//     themeService.set(theme);
//   });
// };
//
// export default useSyncThemeWithUserSettingsSignal;
