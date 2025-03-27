/* eslint-disable qwik/no-use-visible-task */
import {
  $,
  type Signal,
  useOnWindow,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import themeService from "../services/theme.service";
import type { iTheme, iUserSettings } from "../types/types";
import { useVisibilityChange } from "./useVisibilityChange/useVisibilityChange";
import { DEFAULT_THEME } from "../services/gameContext.service/initialState";
import type { useGameContextService } from "../services/gameContext.service/gameContext.service";
import logger from "../services/logger";
import { DebugTypeEnum, LogLevel } from "../constants/game";

type States = {
  ctx?: ReturnType<typeof useGameContextService>;
  unsavedUserSettings?: Signal<iUserSettings>;
};
/**
 * gets theme on window load
 * gets theme on returning from another tab
 * gets theme when component first is visible
 * tracks settings to update theme
 * - resorts to default theme if no theme is found
 * TODO: break this up? right now calls onLoad 3 times, one for game
 * and two for the two modals
 * > or hide modal from render
 * */
const useGetSavedTheme = (states?: States) => {
  const savedTheme = useSignal<iTheme | null>(null);

  const setSavedTheme$ = $((newTheme: iTheme) => {
    themeService.set(newTheme);

    savedTheme.value = newTheme;

    logger(DebugTypeEnum.HOOK, LogLevel.ONE, "~~ setSavedTheme$:", {
      newTheme,
    });

    const isInverted = newTheme === "dark";
    if (
      states?.ctx &&
      states.ctx.state.userSettings.interface.invertCardColors !== isInverted
    ) {
      logger(
        DebugTypeEnum.HOOK,
        LogLevel.TWO,
        "~~ setSavedTheme$ ~ ctx changing:",
        {
          newTheme,
        },
      );
      states.ctx.state.userSettings.interface.invertCardColors = isInverted;
    }
    if (
      states?.unsavedUserSettings &&
      states.unsavedUserSettings.value.interface.invertCardColors !== isInverted
    ) {
      logger(
        DebugTypeEnum.HOOK,
        LogLevel.TWO,
        "~~ setSavedTheme$ ~ unsavedUserSettings changing:",
        {
          newTheme,
        },
      );
      states.unsavedUserSettings.value = {
        ...states.unsavedUserSettings.value,
        interface: {
          ...states.unsavedUserSettings.value.interface,
          invertCardColors: isInverted,
        },
      };
    }
  });

  const handleGetAndSetTheme = $((logString?: string) => {
    const currentTheme = themeService.get();
    logger(DebugTypeEnum.HOOK, LogLevel.ONE, logString, { currentTheme });
    const newTheme = currentTheme ?? DEFAULT_THEME;
    themeService.set(newTheme);

    setSavedTheme$(newTheme);
  });

  // resync theme from localstorage to state when page is loaded
  useOnWindow(
    "load",
    $(() => {
      handleGetAndSetTheme("useGetSavedTheme: running onload:");
    }),
  );

  // resync theme from localstorage to state when coming back from other tab
  useVisibilityChange({
    onShown$: $(() => {
      handleGetAndSetTheme("useGetSavedTheme onShown:");
    }),
  });

  // on load of component e.g. settings modal, update theme in state
  useVisibleTask$(() => {
    const currentTheme = themeService.get();
    logger(
      DebugTypeEnum.HOOK,
      LogLevel.ONE,
      "useGetSavedTheme: visibleTask$ render update savedTheme:",
      { currentTheme },
    );

    if (currentTheme !== null && currentTheme !== savedTheme.value) {
      logger(DebugTypeEnum.HOOK, LogLevel.TWO, "~~ updating theme to:", {
        currentTheme,
      });
      savedTheme.value = currentTheme;
      setSavedTheme$(currentTheme);
    }
  });

  // resync theme from settings to localstorage & state
  useVisibleTask$(({ track }) => {
    const invertCardColors = track(
      () => states?.unsavedUserSettings?.value.interface.invertCardColors,
    );
    logger(
      DebugTypeEnum.HOOK,
      LogLevel.ONE,
      "useGetSavedTheme: visibleTask$ to update theme from unsavedUserSettings",
      { newTheme: invertCardColors },
    );

    const newTheme = invertCardColors ? "dark" : "light";
    if (themeService.get() !== newTheme) {
      logger(DebugTypeEnum.HOOK, LogLevel.TWO, "~~ updating theme to:", {
        newTheme,
      });
      setSavedTheme$(newTheme);
    }
  });

  return savedTheme;
};

export default useGetSavedTheme;
