import {
  component$,
  $,
  useContext,
  useSignal,
  QwikFocusEvent,
} from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";
import Modal from "../modal/modal";
import { SettingsRow } from "../settings-modal/settings-modal";
import Button from "../button/button";
import { GameContext } from "~/v3/context/gameContext";
import { FormattedTime } from "../formatted-time/formatted-time";
import crypto from "node:crypto";
import { useDefaultHash } from "~/routes/game";
import PixelAvatar from "../pixel-avatar/pixel-avatar";
import { NewScore } from "~/v3/db/types";
import serverDbService from "~/v3/services/db.service";
const DEFAULT_HASH_LENGTH_BYTES = 32;

const getRandomBytes = server$((bytes: number = DEFAULT_HASH_LENGTH_BYTES) => {
  return crypto.randomBytes(bytes).toString("hex");
});

export function bufferToHexString(byteArray: Uint8Array) {
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

// export async function clientGetHash(
//   message: string,
//   bytes: number = DEFAULT_HASH_LENGTH_BYTES
// ) {
//   let encoder = new TextEncoder();
//   let data = encoder.encode(message);
//   return window.crypto.subtle
//     .digest("SHA-256", data)
//     .then((res) => bufferToHexString(new Uint8Array(res)))
//     .then((hex) => hex.substring(0, bytes));
//   // return bufferToHexString(
//   //   await window.crypto.subtle
//   //     .digest("SHA-256", data)
//   // ).substring(0, bytes);
// }

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
    identifier.value = await getRandomBytes();
  });

  const selectFieldOnFocus$ = $((e: QwikFocusEvent<HTMLInputElement>) => {
    e.target.select();
  });

  const saveScore$ = $(async () => {
    const newScore: NewScore = {
      deckSize: gameContext.settings.deck.size,
      gameTime: `${gameContext.timer.state.runningTime} millisecond`,
      mismatches: gameContext.game.mismatchPairs.length,
      pairs: gameContext.game.successfulPairs.length,
      userId: identifier.value,
      initials: initials.value,
    };

    console.log("saving score...", { newScore });
    const saved = await serverDbService.createScore(newScore);
    console.log("saved!", { saved });
    await gameContext.fetchScores();
    gameContext.interface.scoresModal.isShowing = true;
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
          <div class="text-slate-100 flex flex-grow justify-between">
            <span>Pairs:</span>
            <span>
              {gameContext.game.successfulPairs.length}/
              {gameContext.settings.deck.size / 2}
            </span>
          </div>
        </SettingsRow>
        <SettingsRow>
          <div class="text-slate-100 flex flex-grow justify-between">
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
          <div class="text-slate-100 flex flex-grow justify-between">
            <span>Time:</span>
            <span>
              <FormattedTime timeMs={gameContext.timer.state.time} limit={3} />
            </span>
          </div>
        </SettingsRow>

        <SettingsRow>
          <div class="flex flex-grow gap-[2%] items-center tooltip w-full">
            <label
              class="text-slate-100 w-4/12 text-left"
              for="deck-card-count-end-game"
            >
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
