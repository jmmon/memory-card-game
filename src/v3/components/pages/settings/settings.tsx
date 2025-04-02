import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";

import Modal from "~/v3/components/templates/modal/modal";
import GameSettings from "~/v3/components/organisms/game-settings/game-settings";

import type { Signal } from "@builder.io/qwik";
import type { iUserSettings } from "~/v3/types/types";
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
      onShown: false,
    },
  );

  const saveOrResetSettings = $(async (newSettings?: Signal<iUserSettings>) => {
    ctx.handle
      .resetGame(newSettings ? newSettings.value : undefined)
      .then(() => {
        // resync and hide modal after new settings are saved
        // console.log("game reset", ctx);
        ctx.handle.hideSettings();
      });
  });

  // resync when showing or hiding modal e.g. if home changed settings but didn't save
  useTask$(({ track }) => {
    track(() => ctx.state.interfaceSettings.settingsModal.isShowing);
    // first save interface changes without requiring save to be clicked
    // then update signal to match all state settings
    ctx.state.userSettings.interface = unsavedUserSettings.value.interface;
    unsavedUserSettings.value = ctx.state.userSettings;
  });

  return (
    <Modal
      isShowing={ctx.state.interfaceSettings.settingsModal.isShowing}
      hideModal$={ctx.handle.hideSettings}
      title="Game Settings"
      containerClasses="bg-opacity-[98%] shadow-2xl"
    >
      <GameSettings
        startShuffling$={ctx.handle.startShuffling}
        unsavedUserSettings={unsavedUserSettings}
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
