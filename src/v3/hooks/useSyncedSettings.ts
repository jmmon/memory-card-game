import type { Signal} from "@builder.io/qwik";
import { $, useSignal, useTask$ } from "@builder.io/qwik";
import type { iUserSettings } from "../types/types";
import { useGameContextService } from "../services/gameContext.service/gameContext.service";
import useGetSavedTheme from "./useGetSavedTheme";

type HideHandle = "hideSettingsModal" | "hideEndOfGameModal";
type ModalName = "settingsModal" | "endOfGameModal";

/**
 * provides ctx, unsavedUserSettings, and saveOrResetSettings$ for modals
 * */
const useSyncedSettings = (modalName: ModalName) => {
  const ctx = useGameContextService();
  const unsavedUserSettings = useSignal<iUserSettings>({
    ...ctx.state.userSettings,
  });
  const handleName = ("hide" +
    modalName[0].toUpperCase() +
    modalName.slice(1)) as HideHandle;

  useGetSavedTheme(
    { ctx, unsavedUserSettings },
    {
      onLoad: false,
    },
  );

  // resync when showing or hiding modal e.g. if home changed settings but didn't save
  useTask$(({ track }) => {
    const isShowing = track(() => ctx.state.interfaceSettings[modalName].isShowing);

    if (isShowing) {
      // ensure settings are resyncd from ctx when showing
      unsavedUserSettings.value = ctx.state.userSettings;
    } else {
      // first save INTERFACE changes without requiring save to be clicked
      // then update signal to match all state settings
      ctx.state.userSettings.interface = unsavedUserSettings.value.interface;
      unsavedUserSettings.value = ctx.state.userSettings;
    }
  });

  const saveOrResetSettings$ = $((newSettings?: Signal<iUserSettings>) => {
    ctx.handle[handleName]();
    ctx.handle.resetGame(newSettings ? newSettings.value : undefined);
  });

  return { unsavedUserSettings, saveOrResetSettings$, ctx };
};
export default useSyncedSettings;
