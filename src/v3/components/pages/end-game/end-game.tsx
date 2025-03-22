import { component$, $, useContext, useSignal, useTask$ } from "@builder.io/qwik";
import { GameContext } from "~/v3/context/gameContext";

import Modal from "~/v3/components/templates/modal/modal";
import FormattedTime from "~/v3/components/molecules/formatted-time/formatted-time";
import Button from "~/v3/components/atoms/button/button";
import ModalRow from "~/v3/components/atoms/modal-row/modal-row";
import { GAME } from "~/v3/constants/game";
import ModalStats from "../../atoms/modal-stats/modal-stats";
import InfoTooltip from "../../organisms/info-tooltip/info-tooltip";

export default component$(() => {
  const gameContext = useContext(GameContext);

  // for adjusting deck size before restarting
  const cardCount = useSignal<string>(String(gameContext.userSettings.deck.size));

  useTask$(({ track }) => {
    track(() => gameContext.userSettings.deck.size);
    cardCount.value = String(gameContext.userSettings.deck.size);
  })

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
          <ModalStats
            label="Pairs:"
            content={
              `${gameContext.game.successfulPairs.length
              }/${gameContext.userSettings.deck.size / 2
              }`
            }
          />
        </ModalRow>
        <ModalRow>
          <ModalStats
            label="Mismatches:"
            content={
              `${gameContext.game.mismatchPairs.length}
              ${gameContext.userSettings.maxAllowableMismatches !== -1
                ? `/${gameContext.userSettings.deck.size / 2}`
                : ""}`
            }
          />
        </ModalRow>
        <ModalRow>
          <ModalStats
            label="Time:"
          >
            <FormattedTime timeMs={gameContext.timer.state.time} limit={3} />
          </ModalStats>
        </ModalRow>

        <ModalRow>
          <div class="flex w-full flex-grow items-center gap-[2%]">
            <label
              class="w-4/12 text-left text-slate-100"
              for="deck-card-count-end-game"
            >
              Card Count: {cardCount}
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
            <InfoTooltip>
              {cardCount} - Number of cards in the deck.
            </InfoTooltip>
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
