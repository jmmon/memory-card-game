import { $, useOnWindow, useSignal } from "@builder.io/qwik";
import storageService from "../services/storage.service";
import themeService from "../services/theme.service";
import { USER_SETTINGS } from "../services/gameContext.service/initialState";
import { iTheme } from "../types/types";

const useInitializeTheme = () => {
  const savedTheme = useSignal<iTheme | null>(null);

  useOnWindow(
    "load",
    $(() => {
      const theme = storageService.getTheme();
      if (theme) {
        themeService.save(theme);
        savedTheme.value = theme;

        return;
      }
      themeService.save(
        USER_SETTINGS.interface.invertCardColors ? "dark" : "light",
      );
    }),
  );

  return savedTheme;
};

export default useInitializeTheme;
