import { $, component$, useContext, useSignal } from "@builder.io/qwik";
import { GameContext } from "~/v3/context/gameContext";

import Modal from "../../templates/modal/modal";
import GameSettings from "../../organisms/game-settings/game-settings";

import type { iGameSettings } from "~/v3/types/types";

export default component$(() => {
  const gameContext = useContext(GameContext);
  const unsavedSettings = useSignal<iGameSettings>({
    ...gameContext.settings,
  });

  const hideModal$ = $(() => {
    // resync when hiding modal
    unsavedSettings.value = gameContext.settings;
    gameContext.hideSettings();
  });

  return (
    <Modal
      isShowing={gameContext.interface.settingsModal.isShowing}
      hideModal$={hideModal$}
      title="Game Settings"
    >
      <GameSettings hideModal$={hideModal$} unsavedSettings={unsavedSettings} />
    </Modal>
  );
});



