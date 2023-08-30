import { component$, $, useContext, useSignal } from "@builder.io/qwik";
import Modal from "../modal/modal";
import { AppContext } from "../v3-context/v3.context";
import { SettingsRow } from "../settings-modal/settings-modal";
import Button from "../button/button";

const GreyedAtZero = ({ val, text }: { val: number; text: string }) => {
  return (
    <span class={val === 0 ? "text-slate-400" : ""}>
      {val}
      {text}
    </span>
  );
};

export const formatTime = (timeMs: number) => {
  const minutes = Math.floor(timeMs / 1000 / 60);
  const seconds = Math.floor((timeMs / 1000) % 60)
    .toString()
    .padStart(2, "0");
  const ms = Math.floor(timeMs % 1000)
    .toString()
    .padStart(3, "0");
  return { minutes, seconds, ms };
};

export const FormattedTime = ({ timeMs }: { timeMs: number }) => {
  const { minutes, seconds, ms } = formatTime(timeMs);

  return (
    <>
      <GreyedAtZero val={minutes} text="m" /> {seconds}
      <span class="text-xs text-slate-400">.{ms}s</span>
    </>
  );
};

export default component$(() => {
  const appStore = useContext(AppContext);

  // for adjusting deck size before restarting
  const cardCount = useSignal<string>(String(appStore.settings.deck.size));

  const hideModal$ = $(() => {
    appStore.interface.endOfGameModal.isShowing = false;
  });
  return (
    <Modal
      isShowing={appStore.interface.endOfGameModal.isShowing}
      hideModal$={hideModal$}
      title={appStore.interface.endOfGameModal.isWin ? "You Win!" : "Game Over"}
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
              <FormattedTime timeMs={appStore.game.time.accum} />
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
              bind:value={cardCount}
            />
            <span class="tooltiptext">
              {cardCount.value} - Number of cards in the deck.
            </span>
          </div>
        </SettingsRow>
        <Button
          onClick$={() => {
            appStore.resetGame({
              deck: {
                ...appStore.settings.deck,
                size: Number(cardCount.value),
              },
            });

            appStore.interface.endOfGameModal.isShowing = false;
          }}
          text="Play Again"
        />
        <Button onClick$={hideModal$} text="Close" />
      </div>
    </Modal>
  );
});
