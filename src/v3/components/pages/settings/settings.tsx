import { $, component$, useContext, useSignal } from "@builder.io/qwik";
import { GameContext } from "~/v3/context/gameContext";

import Modal from "~/v3/components/templates/modal/modal";
import GameSettings from "~/v3/components/organisms/game-settings/game-settings";

import type { Signal} from "@builder.io/qwik";
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

  const resetSettings = $(async (newSettings?: Signal<iUserSettings>) => {
    await gameContext.resetGame(newSettings ? newSettings.value : undefined);
    // resync and hide modal after new settings are saved
    console.log("game reset", gameContext);
    hideModal$();
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
        saveSettings$={resetSettings}
        unsavedUserSettings={unsavedSettings}
        gameSettings={gameContext.gameSettings}
      />
    </Modal>
  );
});
