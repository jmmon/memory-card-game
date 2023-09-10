import {
  component$,
  $,
  useContext,
  useSignal,
  QwikFocusEvent,
  useComputed$,
} from "@builder.io/qwik";
import { isServer } from "@builder.io/qwik/build";
import { server$ } from "@builder.io/qwik-city";
import Modal from "../modal/modal";
import { SettingsRow } from "../settings-modal/settings-modal";
import Button from "../button/button";
import { GameContext } from "~/v3/context/gameContext";
import { FormattedTime } from "../formatted-time/formatted-time";
import crypto from "node:crypto";
import { useDefaultHash } from "~/routes/game";
const DEFAULT_HASH_LENGTH_BYTES = 32;

const refreshHash = server$((bytes: number = DEFAULT_HASH_LENGTH_BYTES) => {
  return crypto.randomBytes(bytes).toString("hex");
});

export function bufferToHexString(buffer: ArrayBuffer) {
  let byteArray = new Uint8Array(buffer);

  let hexCodes = [...byteArray].map((value) => {
    return value.toString(16).padStart(2, "0");
  });

  return hexCodes.join("");
}

export const serverGetHash = server$(function (
  message: string,
  bytes: number = DEFAULT_HASH_LENGTH_BYTES
) {
  return crypto
    .createHash("sha256")
    .update(message)
    .digest("hex")
    .substring(0, bytes);
});

export async function clientGetHash(
  message: string,
  bytes: number = DEFAULT_HASH_LENGTH_BYTES
) {
  let encoder = new TextEncoder();
  let data = encoder.encode(message);
  return bufferToHexString(
    await window.crypto.subtle.digest("SHA-256", data)
  ).substring(0, bytes);
}

export default component$(() => {
  const gameContext = useContext(GameContext);
  const defaultHash = useDefaultHash();

  // for adjusting deck size before restarting
  const cardCount = useSignal<string>(String(gameContext.settings.deck.size));

  const hideModal$ = $(() => {
    gameContext.interface.endOfGameModal.isShowing = false;
  });

  const initials = useSignal("---");
  const identifier = useSignal(defaultHash.value);

  const getNewHash$ = $(async () => {
    identifier.value = await refreshHash();
  });

  const clearFieldOnFocus$ = $((e: QwikFocusEvent<HTMLInputElement>) => {
    e.target.select();
  });

  const computedHash = useComputed$(async () => {
    const value = initials.value + "-" + identifier.value;
    if (isServer) {
      return "SERVER-" + (await serverGetHash(value));
    } else {
      return "CLIENT-" + (await clientGetHash(value));
    }
  });
  return (
    <Modal
      // isShowing={gameContext.interface.endOfGameModal.isShowing}
      isShowing={true}
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
        <div class="flex flex-col md:flex-row gap-0.5 md:gap-1 py-[2%] px-[4%]">
          <SettingsRow>
            <div class="flex flex-grow justify-between">
              <span>Time:</span>
              <span>
                <FormattedTime
                  timeMs={gameContext.timer.state.runningTime}
                  limit={3}
                />
              </span>
            </div>
          </SettingsRow>
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
        </div>
        <hr />
        <div class="flex py-[2%] px-[4%]">
          <SettingsRow>
            <div class="flex flex-col gap-1 items-center w-full">
              <label class="w-full flex justify-center gap-2">
                Initials:
                <input
                  type="text"
                  class="ml-2 text-center w-[5ch] bg-slate-800 text-slate-100"
                  maxLength={3}
                  onInput$={(e) => {
                    initials.value = (
                      e.target as HTMLInputElement
                    ).value.toUpperCase();
                  }}
                  onFocus$={clearFieldOnFocus$}
                  value={initials.value}
                />
              </label>
              <label class="text-xs w-full">
                Identifier:
                <input
                  type="text"
                  class="block w-full bg-slate-800 text-slate-100"
                  onFocus$={clearFieldOnFocus$}
                  bind:value={identifier}
                />
              </label>
              <Button onClick$={getNewHash$}>Refresh Hash</Button>
              <span class="text-xs break-all">
                Calc'd Hash: {computedHash.value}
              </span>
            </div>
          </SettingsRow>
        </div>
        <hr />
        <div class="flex py-[2%] px-[4%]">
          <SettingsRow>
            <div class="flex flex-grow gap-[2%] items-center tooltip w-full">
              <label class="w-4/12 text-left" for="deck-card-count-end-game">
                Card Count:
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
        </div>
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
        >
          Play Again
        </Button>
        <Button onClick$={hideModal$}>Close</Button>
      </div>
    </Modal>
  );
});
