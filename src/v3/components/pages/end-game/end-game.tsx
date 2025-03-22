import { component$, $, useContext, useSignal, useTask$ } from "@builder.io/qwik";
import { GameContext } from "~/v3/context/gameContext";

import Modal from "~/v3/components/templates/modal/modal";
import Button from "~/v3/components/atoms/button/button";
import ModalRow from "~/v3/components/atoms/modal-row/modal-row";
import type { iUserSettings } from "~/v3/types/types";
import DeckSizeChanger from "../../molecules/deck-size-changer/deck-size-changer";
import GameStats from "../../molecules/game-stats/game-stats";

export default component$(() => {
  const gameContext = useContext(GameContext);

  // for adjusting deck size before restarting
  const unsavedUserSettings = useSignal<iUserSettings>(gameContext.userSettings);

  useTask$(({ track }) => {
    track(() => gameContext.userSettings.deck.size);
    unsavedUserSettings.value.deck.size = gameContext.userSettings.deck.size;
  })

  const hideModal$ = $(() => {
    gameContext.interface.endOfGameModal.isShowing = false;
    // probably unneeded thanks to task tracking
    // unsavedUserSettings.value.deck.size = gameContext.userSettings.deck.size; 
  });

  return (
    <Modal
      isShowing={gameContext.interface.endOfGameModal.isShowing}
      // isShowing={true}
      hideModal$={hideModal$}
      title={
        gameContext.interface.endOfGameModal.isWin ? "You Win!" : "Game Over"
      }
      bgStyles={{ backgroundColor: "rgba(0,0,0,0.1)" }}
      options={{
        detectClickOutside: false,
      }}
    >
      <div class="flex flex-col gap-0.5 px-[4%] py-[2%] md:gap-1">
        <GameStats q:slot="game-stats" />

        <ModalRow>
          <DeckSizeChanger
            userSettings={unsavedUserSettings}
            isLocked={unsavedUserSettings.value.deck.isLocked}
            for="end-game"
          />
        </ModalRow>

        <Button
          onClick$={() => {
            gameContext.resetGame({
              deck: {
                ...gameContext.userSettings.deck,
                size: Number(unsavedUserSettings.value.deck.size),
              },
            });

            gameContext.interface.endOfGameModal.isShowing = false;
          }}
        >
          Play Again
        </Button>

        {/*
        <Button onClick$={hideModal$} >
          Close
        </Button>
*/}
      </div>
    </Modal>
  );
});
