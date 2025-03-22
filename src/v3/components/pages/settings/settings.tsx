import {
  $,
  component$,
  useContext,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import { GameContext } from "~/v3/context/gameContext";

import Modal from "~/v3/components/templates/modal/modal";
import GameSettings from "~/v3/components/organisms/game-settings/game-settings";

import type { Signal } from "@builder.io/qwik";
import type { iUserSettings } from "~/v3/types/types";
import Button from "../../atoms/button/button";
import GameStats from "../../molecules/game-stats/game-stats";

export default component$(() => {
  const gameContext = useContext(GameContext);
  const unsavedSettings = useSignal<iUserSettings>({
    ...gameContext.userSettings,
  });

  const hideModal$ = $(() => {
    // resync when hiding modal
    unsavedSettings.value = gameContext.userSettings;
    gameContext.hideSettings();
  });

  const saveOrResetSettings = $(async (newSettings?: Signal<iUserSettings>) => {
    gameContext
      .resetGame(newSettings ? newSettings.value : undefined)
      .then(() => {
        // resync and hide modal after new settings are saved
        console.log("game reset", gameContext);
        hideModal$();
      });
  });

  // fixes end-game modal changes not reflecting in settings modal
  // since before, the unsavedSettings was only set on mount
  useTask$(({ track }) => {
    track(() => gameContext.interfaceSettings.settingsModal.isShowing);
    if (gameContext.interfaceSettings.settingsModal.isShowing) {
      unsavedSettings.value = gameContext.userSettings;
    }
  });

  return (
    <Modal
      isShowing={gameContext.interfaceSettings.settingsModal.isShowing}
      hideModal$={hideModal$}
      title="Game Settings"
      containerClasses="bg-opacity-95"
    >
      <GameSettings
        // startShuffling$={gameContext.startShuffling}
        unsavedUserSettings={unsavedSettings}
      >
        {gameContext.timer.state.time > 0 && <GameStats q:slot="game-stats" />}

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
