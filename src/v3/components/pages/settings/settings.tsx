import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";

import Modal from "~/v3/components/templates/modal/modal";
import GameSettings from "~/v3/components/organisms/game-settings/game-settings";

import type { Signal } from "@builder.io/qwik";
import { GameStateEnum, type iUserSettings } from "~/v3/types/types";
import Button from "../../atoms/button/button";
import GameStats from "../../molecules/game-stats/game-stats";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";
import useGetSavedTheme from "~/v3/hooks/useGetSavedTheme";

export default component$(() => {
  const ctx = useGameContextService();
  const unsavedUserSettings = useSignal<iUserSettings>({
    ...ctx.state.userSettings,
  });

  useGetSavedTheme(
    { ctx, unsavedUserSettings },
    {
      onLoad: false,
    },
  );

  const saveOrResetSettings = $(async (newSettings?: Signal<iUserSettings>) => {
    ctx.handle.resetGame(newSettings ? newSettings.value : undefined);
    ctx.handle.hideSettings();
  });

  // resync when showing or hiding modal e.g. if home changed settings but didn't save
  useTask$(({ track }) => {
    const isShowing = track(() => ctx.state.interfaceSettings.settingsModal.isShowing);

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

  return (
    <Modal
      isShowing={ctx.state.interfaceSettings.settingsModal.isShowing}
      hideModal$={ctx.handle.hideSettings}
      title="Game Settings"
    >
      <GameSettings
        startShuffling$={ctx.handle.startShuffling}
        unsavedUserSettings={unsavedUserSettings}
        isShufflingDisabled={
          ctx.state.gameData.gameState !== GameStateEnum.IDLE
        }
      >
        {ctx.timer.state.time > 0 && <GameStats q:slot="game-stats" />}

        <div
          q:slot="footer"
          class="mt-5 flex flex-grow items-center justify-around"
        >
          <Button onClick$={saveOrResetSettings}>
            <span class="text-slate-100">Reset Game</span>
          </Button>
          <Button
            onClick$={() => {
              saveOrResetSettings(unsavedUserSettings);
            }}
          >
            <span class="text-slate-100">Save &amp; Reset</span>
          </Button>
        </div>
      </GameSettings>
    </Modal>
  );
});
