import { component$, $, useSignal, useTask$ } from "@builder.io/qwik";

import Modal from "~/v3/components/templates/modal/modal";
import Button from "~/v3/components/atoms/button/button";
import ModalRow from "~/v3/components/atoms/modal-row/modal-row";
import type { iUserSettings } from "~/v3/types/types";
import DeckSizeChanger from "../../molecules/deck-size-changer/deck-size-changer";
import GameStats from "../../molecules/game-stats/game-stats";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";

export default component$(() => {
  const ctx = useGameContextService();

  // for adjusting deck size before restarting
  const unsavedUserSettings = useSignal<iUserSettings>(ctx.state.userSettings);

  useTask$(({ track }) => {
    track(() => ctx.state.userSettings.deck.size);
    unsavedUserSettings.value.deck.size = ctx.state.userSettings.deck.size;
  });

  const hideModal$ = $(() => {
    ctx.state.interfaceSettings.endOfGameModal.isShowing = false;
    // probably unneeded thanks to task tracking
    // unsavedUserSettings.value.deck.size = ctx.state.userSettings.deck.size;
  });

  return (
    <Modal
      isShowing={ctx.state.interfaceSettings.endOfGameModal.isShowing}
      // isShowing={true}
      hideModal$={hideModal$}
      title={
        ctx.state.interfaceSettings.endOfGameModal.isWin
          ? "You Win!"
          : "Game Over"
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
            ctx.handle.resetGame({
              deck: {
                ...ctx.state.userSettings.deck,
                size: Number(unsavedUserSettings.value.deck.size),
              },
            });

            ctx.state.interfaceSettings.endOfGameModal.isShowing = false;
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
