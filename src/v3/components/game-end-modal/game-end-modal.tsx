import { component$, $, useContext, useSignal } from "@builder.io/qwik";
import Modal from "../modal/modal";
import { SettingsRow } from "../settings-modal/settings-modal";
import Button from "../button/button";
import { GameContext } from "~/v3/context/gameContext";
import { FormattedTime } from "../formatted-time/formatted-time";

export default component$(() => {
  const gameContext = useContext(GameContext);

  // for adjusting deck size before restarting
  const cardCount = useSignal<string>(String(gameContext.settings.deck.size));

  const hideModal$ = $(() => {
    gameContext.interface.endOfGameModal.isShowing = false;
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
      <div class="flex gap-0.5 md:gap-1 flex-col py-[2%] px-[4%]">
        <SettingsRow>
          <div class="flex flex-grow justify-between">
            <span>Pairs:</span>
            <span>
              {gameContext.game.successfulPairs.length}/
              {gameContext.settings.deck.size / 2}
            </span>
          </div>
        </SettingsRow>
        <SettingsRow>
          <div class="flex flex-grow justify-between">
            <span>Mismatches:</span>
            <span>
              {gameContext.game.mismatchPairs.length}
              {gameContext.settings.maxAllowableMismatches !== -1
                ? `/${gameContext.settings.deck.size / 2} `
                : ""}
            </span>
          </div>
        </SettingsRow>
        <SettingsRow>
          <div class="flex flex-grow justify-between">
            <span>Time:</span>
            <span>
              <FormattedTime timeMs={gameContext.timer.state.runningTime} limit={3}  />
            </span>
          </div>
        </SettingsRow>

        <SettingsRow>
          <div class="flex flex-grow gap-[2%] items-center tooltip w-full">
            <label class="w-4/12 text-left" for="deck-card-count-end-game">
              Deck Card Count:
            </label>
            <input
              name="deck-card-count-end-game"
              id="deck-card-count-end-game"
              class="flex-grow w-8/12"
              type="range"
              min={gameContext.settings.deck.MINIMUM_CARDS}
              max={gameContext.settings.deck.MAXIMUM_CARDS}
              step="2"
              bind:value={cardCount}
            />
            <span class="tooltiptext">
              {cardCount.value} - Number of cards in the deck.
            </span>
          </div>
        </SettingsRow>
        <Button
          onClick$={() => {
            gameContext.resetGame({
              deck: {
                ...gameContext.settings.deck,
                size: Number(cardCount.value),
              },
            });

            gameContext.interface.endOfGameModal.isShowing = false;
          }}
          text="Play Again"
        />
        <Button onClick$={hideModal$} text="Close" />
      </div>
    </Modal>
  );
});
