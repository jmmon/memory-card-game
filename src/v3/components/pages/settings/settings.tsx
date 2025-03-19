import { $, component$, useContext, useSignal, useTask$ } from "@builder.io/qwik";
import { GameContext } from "~/v3/context/gameContext";

import Modal from "~/v3/components/templates/modal/modal";
import GameSettings from "~/v3/components/organisms/game-settings/game-settings";

import type { Signal } from "@builder.io/qwik";
import type { iUserSettings } from "~/v3/types/types";

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
    gameContext.resetGame(newSettings ? newSettings.value : undefined)
      .then(() => {
        // resync and hide modal after new settings are saved
        console.log("game reset", gameContext);
        hideModal$();
      });
  });

  // fixes end-game modal changes not reflecting in settings modal
  // since before, the unsavedSettings was only set on mount
  useTask$(({ track }) => {
    track(() => gameContext.interface.settingsModal.isShowing);
    if (gameContext.interface.settingsModal.isShowing) {
      unsavedSettings.value = gameContext.userSettings;
    }
    // track(() => gameContext.userSettings);
  });

  return (
    <Modal
      isShowing={gameContext.interface.settingsModal.isShowing}
      hideModal$={hideModal$}
      title="Game Settings"
    >
      <GameSettings
        gameTime={gameContext.timer.state.time}
        startShuffling$={gameContext.startShuffling}
        saveSettings$={saveOrResetSettings}
        unsavedUserSettings={unsavedSettings}
        gameSettings={gameContext.gameSettings}
      />
    </Modal>
  );
});
