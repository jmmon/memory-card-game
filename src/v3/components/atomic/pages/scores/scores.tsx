import { $, component$, useContext } from "@builder.io/qwik";
import { GameContext } from "~/v3/context/gameContext";

import Modal from "../../templates/modal/modal";

export default component$(() => {
  const gameContext = useContext(GameContext);

  const hideModal$ = $(() => {
    // resync when hiding modal
    gameContext.hideSettings();
  });


  return (
    <Modal
      isShowing={gameContext.interface.settingsModal.isShowing}
      hideModal$={hideModal$}
      title="Game Settings"
    >
      <div>This holds the scores</div>
    </Modal>
  );
});
