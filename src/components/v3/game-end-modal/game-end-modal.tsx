import { component$, useContext, useSignal } from "@builder.io/qwik";
import Modal from "../modal/modal";
import { AppContext } from "../v3-context/v3.context";
import { SettingsRow } from "../settings-modal/settings-modal";
import Button from "../button/button";

export default component$(() => {
  const appStore = useContext(AppContext);

  // for adjusting deck size before restarting
  const cardCount = useSignal<number>(appStore.settings.deck.size);

  return (
    <Modal
      isShowing={appStore.interface.endOfGameModal.isShowing}
      hideModal$={() => {
        appStore.interface.endOfGameModal.isShowing = false;
      }}
      title={appStore.interface.endOfGameModal.isWin ? "You Win!" : "Game Over"}
      bgStyles={{ backgroundColor: "rgba(0,0,0,0.1)" }}
    >
      <div class="flex gap-0.5 md:gap-1 flex-col py-[2%] px-[4%]">
        <SettingsRow>
          <div class="flex flex-grow justify-between">
            <span>Pairs:</span>
            <span>
              {appStore.game.successfulPairs.length}/
              {appStore.settings.deck.size / 2}
            </span>
          </div>
        </SettingsRow>
        <SettingsRow>
          <div class="flex flex-grow justify-between">
            <span>Mismatches:</span>
            <span>
              {appStore.game.mismatchPairs.length}
              {appStore.settings.maxAllowableMismatches !== -1
                ? `/${appStore.settings.deck.size / 2} `
                : ""}
            </span>
          </div>
        </SettingsRow>
        <SettingsRow>
          <div class="flex flex-grow justify-between">
            <span>Time:</span>
            <span>
              {(appStore.game.time.end - appStore.game.time.start) / 1000}s
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
              min={appStore.settings.deck.MINIMUM_CARDS}
              max={appStore.settings.deck.MAXIMUM_CARDS}
              step="2"
              value={appStore.settings.deck.size}
              onInput$={(e: Event) => {
                cardCount.value = Number((e.target as HTMLInputElement).value);
              }}
            />
            <span class="tooltiptext">
              {cardCount.value} - Number of cards in the deck.
            </span>
          </div>
        </SettingsRow>
        <Button
          onClick$={() => {
            appStore.resetGame({
              deck: { ...appStore.settings.deck, size: cardCount.value },
            });
            appStore.interface.endOfGameModal.isShowing = false;
          }}
          text="Play Again"
        />
      </div>
    </Modal>
  );
});
