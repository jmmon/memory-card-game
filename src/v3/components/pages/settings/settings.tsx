import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";

import Modal from "~/v3/components/templates/modal/modal";
import GameSettings from "~/v3/components/organisms/game-settings/game-settings";

import type { Signal } from "@builder.io/qwik";
import type { iUserSettings } from "~/v3/types/types";
import Button from "../../atoms/button/button";
import GameStats from "../../molecules/game-stats/game-stats";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";

export default component$(() => {
  const ctx = useGameContextService();
  const unsavedSettings = useSignal<iUserSettings>({
    ...ctx.state.userSettings,
  });

  const hideModal$ = $(() => {
    // resync when hiding modal
    unsavedSettings.value = ctx.state.userSettings;
    ctx.handle.hideSettings();
  });

  const saveOrResetSettings = $(async (newSettings?: Signal<iUserSettings>) => {
    ctx.handle
      .resetGame(newSettings ? newSettings.value : undefined)
      .then(() => {
        // resync and hide modal after new settings are saved
        console.log("game reset", ctx);
        hideModal$();
      });
  });

  // fixes end-game modal changes not reflecting in settings modal
  // since before, the unsavedSettings was only set on mount
  useTask$(({ track }) => {
    track(() => ctx.state.interfaceSettings.settingsModal.isShowing);
    if (ctx.state.interfaceSettings.settingsModal.isShowing) {
      unsavedSettings.value = ctx.state.userSettings;
    }
  });

  return (
    <Modal
      isShowing={ctx.state.interfaceSettings.settingsModal.isShowing}
      hideModal$={hideModal$}
      title="Game Settings"
      containerClasses="bg-opacity-[98%] shadow-2xl"
    >
      <GameSettings
        startShuffling$={ctx.handle.startShuffling}
        unsavedUserSettings={unsavedSettings}
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
              saveOrResetSettings(unsavedSettings);
            }}
          >
            <span class="text-slate-100">Save &amp; Reset</span>
          </Button>
        </div>
      </GameSettings>
    </Modal>
  );
});
