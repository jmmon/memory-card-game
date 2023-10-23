import { component$, $, useContext, useSignal } from "@builder.io/qwik";
import { GameContext } from "~/v3/context/gameContext";

import Modal from "../../templates/modal/modal";
import FormattedTime from "../../molecules/formatted-time/formatted-time";
import Button from "../../atoms/button/button";
import ModalRow from "../../atoms/modal-row/modal-row";
import { GAME } from "~/v3/constants/game";

export default component$(() => {
  const gameContext = useContext(GameContext);

  // for adjusting deck size before restarting
  const cardCount = useSignal<string>(String(gameContext.userSettings.deck.size));

  const hideModal$ = $(() => {
    gameContext.interface.endOfGameModal.isShowing = false;
    cardCount.value = String(gameContext.userSettings.deck.size);
  });

  return (
    <Modal
      isShowing={gameContext.interface.endOfGameModal.isShowing}
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
        <ModalRow>
          <div class="flex flex-grow justify-between text-slate-100">
            <span>Pairs:</span>
            <span>
              {gameContext.game.successfulPairs.length}/
              {gameContext.userSettings.deck.size / 2}
            </span>
          </div>
        </ModalRow>
        <ModalRow>
          <div class="flex flex-grow justify-between text-slate-100">
            <span>Mismatches:</span>
            <span>
              {gameContext.game.mismatchPairs.length}
              {gameContext.userSettings.maxAllowableMismatches !== -1
                ? `/${gameContext.userSettings.deck.size / 2} `
                : ""}
            </span>
          </div>
        </ModalRow>
        <ModalRow>
          <div class="flex flex-grow justify-between text-slate-100">
            <span>Time:</span>
            <span>
              <FormattedTime timeMs={gameContext.timer.state.time} limit={3} />
            </span>
          </div>
        </ModalRow>

        <ModalRow>
          <div class="tooltip flex w-full flex-grow items-center gap-[2%]">
            <label
              class="w-4/12 text-left text-slate-100"
              for="deck-card-count-end-game"
            >
              Deck Card Count:
            </label>
            <input
              name="deck-card-count-end-game"
              id="deck-card-count-end-game"
              class="w-8/12 flex-grow"
              type="range"
              min={GAME.MIN_CARD_COUNT}
              max={GAME.MAX_CARD_COUNT}
              step="2"
              bind:value={cardCount}
            />
            <span class="tooltiptext">
              {cardCount.value} - Number of cards in the deck.
            </span>
          </div>
        </ModalRow>

        <Button
          onClick$={() => {
            gameContext.resetGame({
              deck: {
                ...gameContext.userSettings.deck,
                size: Number(cardCount.value),
              },
            });

            gameContext.interface.endOfGameModal.isShowing = false;
          }}
        >
          Play Again
        </Button>

        <Button onClick$={hideModal$} >
          Close
        </Button>
      </div>
    </Modal>
  );
});
