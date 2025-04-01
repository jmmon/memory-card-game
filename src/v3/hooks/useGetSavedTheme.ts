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
type Opts = {
  onLoad?: boolean;
  onShown?: boolean;
  onVisible?: boolean;
  onTrack?: boolean;
};
const DEFAULT_OPTS = {
  onLoad: true,
  onShown: true,
  onVisible: true,
  onTrack: true,
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
const useGetSavedTheme = (states: States, opts: Opts) => {
  opts = {
    ...DEFAULT_OPTS,
    ...opts,
  };
  // only used for startup visibleTask$
  const _savedTheme = useSignal<iTheme | null>(null);

  const setSavedTheme$ = $((newTheme: iTheme) => {
    themeService.set(newTheme);
    _savedTheme.value = newTheme;

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

  /**
   * this is called only from onShown and onLoad
   * so only needs to happen once per route
   * */
  const handleGetAndSetTheme$ = $((logString?: string) => {
    const currentTheme = themeService.get();

    logger(DebugTypeEnum.HOOK, LogLevel.ONE, logString, { currentTheme });

    const newTheme = currentTheme ?? DEFAULT_THEME;
    themeService.set(newTheme);
    setSavedTheme$(newTheme);
  });

  // resync theme from localstorage to states when page is loaded
  useOnWindow(
    "load",
    opts.onLoad
      ? $(() => {
          handleGetAndSetTheme$("useGetSavedTheme: running onload:");
        })
      : undefined,
  );

  // resync theme from localstorage to states when coming back from other tab
  useVisibilityChange({
    onShown$: opts.onShown
      ? $(() => {
          handleGetAndSetTheme$("useGetSavedTheme onShown:");
        })
      : undefined,
  });

  // on visible of component e.g. settings modal, update theme in state
  // only runs on startup since modals are rendered but hidden
  // syncs ctx and unsavedUserSettings
  useVisibleTask$(() => {
    if (!opts.onVisible) {
      logger(DebugTypeEnum.HOOK, LogLevel.ONE, "SKIPPING onVisible");
      return;
    }

    const currentTheme = themeService.get();
    logger(
      DebugTypeEnum.HOOK,
      LogLevel.ONE,
      "useGetSavedTheme: visibleTask$ render update savedTheme:",
      { currentTheme },
    );

    if (currentTheme && currentTheme !== _savedTheme.value) {
      logger(DebugTypeEnum.HOOK, LogLevel.TWO, "~~ updating theme to:", {
        currentTheme,
      });
      setSavedTheme$(currentTheme);
    }
  });

  // resync theme from settings to localstorage & state
  // only for end-game, settings-modal, and initial settings
  // but other syncing has to sync with settings as well
  useVisibleTask$(({ track }) => {
    if (!opts.onTrack) {
      logger(DebugTypeEnum.HOOK, LogLevel.ONE, "SKIPPING onTrack");
      return;
    }

    const invertFromTracked = track(
      () => states?.unsavedUserSettings?.value.interface.invertCardColors,
    );
    const currentTheme = themeService.get();
    const trackedTheme = invertFromTracked ? "dark" : "light";
    logger(
      DebugTypeEnum.HOOK,
      LogLevel.ONE,
      "useGetSavedTheme: visibleTask$ to update theme from unsavedUserSettings",
      { newTheme: trackedTheme },
    );

    if (currentTheme !== trackedTheme) {
      logger(DebugTypeEnum.HOOK, LogLevel.TWO, "~~ updating theme to:", {
        newTheme: trackedTheme,
      });
      setSavedTheme$(trackedTheme);
    }
  });
};

export default useGetSavedTheme;
