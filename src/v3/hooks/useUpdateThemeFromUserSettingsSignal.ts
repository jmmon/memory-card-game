import type { Signal } from "@builder.io/qwik";
import { isServer, useTask$ } from "@builder.io/qwik";
import type { iTheme, iUserSettings } from "../types/types";
import themeService from "../services/theme.service";

const useSyncThemeWithUserSettingsSignal = (
  userSettings: Signal<iUserSettings>,
  savedTheme?: Signal<iTheme | null>,
) => {
  // supposed to update theme based on settings, but also
  // needs to take savedTheme and if it exists then do the inverse:
  // update settings based on savedTheme
  useTask$(({ track }) => {
    console.log("updateThemeTask");
    if (isServer) return;
    const isInvertedFromSettings = track(
      () => userSettings.value.interface.invertCardColors,
    );
    const themeFromLocalStorage = track(() => savedTheme?.value);

    // check if we got a theme from localstorage
    if (themeFromLocalStorage) {
      // have a saved theme, so use this as source of truth to update settings and save theme
      const invertedFromSavedTheme = themeFromLocalStorage === "dark";
      if (
        userSettings.value.interface.invertCardColors !== invertedFromSavedTheme
      ) {
        // if not the same, then update settings signal
        userSettings.value.interface.invertCardColors = invertedFromSavedTheme;
      }
      return;
    }

    const theme = isInvertedFromSettings ? "dark" : "light";
    themeService.save(theme);
  });
};

export default useSyncThemeWithUserSettingsSignal;
