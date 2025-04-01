import {
  component$,
  $,
  useContext,
  useSignal,
  useOnWindow,
  useVisibleTask$,
} from "@builder.io/qwik";
// import { server$ } from "@builder.io/qwik-city";
import Modal from "../modal/modal";
import { SettingsRow } from "../settings-modal/settings-modal";
import Button from "../button/button";
import { GameContext } from "~/v3/context/gameContext";
import { FormattedTime } from "../formatted-time/formatted-time";
// import crypto from "node:crypto";
import { useDefaultHash } from "~/routes/game";
import PixelAvatar from "../pixel-avatar/pixel-avatar";
import type { NewScore } from "~/v3/db/types";
import serverDbService from "~/v3/services/db.service";
import CONSTANTS from "~/v3/utils/constants";
import { getRandomBytes } from "~/v3/services/seed";

export function bufferToHexString(byteArray: Uint8Array) {
  const hexCodes = [...byteArray].map((value) => {
    return value.toString(16).padStart(2, "0");
  });

  return hexCodes.join("");
}

const limitSizeMinMax = (val: number, min: number = 60, max: number = 100) =>
  Math.max(min, Math.min(max, val));

export default component$(() => {
  const gameContext = useContext(GameContext);
  const defaultHash = useDefaultHash();
  const data = useSignal("");

  // for adjusting deck size before restarting
  const cardCount = useSignal<string>(String(gameContext.settings.deck.size));

  const hideModal$ = $(() => {
    gameContext.interface.endOfGameModal.isShowing = false;
  });

  const initials = useSignal("---");
  const identifier = useSignal(defaultHash.value);

  const getNewHash$ = $(async () => {
    identifier.value = getRandomBytes();
  });

  const selectFieldOnFocus$ = $(
    (_: FocusEvent, t: HTMLInputElement | HTMLTextAreaElement) => {
      t.focus();
    },
  );

  const saveScore$ = $(async () => {
    if (gameContext.game.isSaved) return;

    const [dimensions, pixelData] = data.value.split(":");
    const [cols, rows] = dimensions.split("x");
    const [halfPixels, color] = pixelData.split(".");

    const newScore: NewScore = {
      createdAt: Date.now(),
      deckSize: gameContext.settings.deck.size,
      gameTimeDs: gameContext.timer.state.timeDs,
      mismatches: gameContext.game.mismatchPairs.length,
      pairs: gameContext.game.successfulPairs.length,
      userId: identifier.value,
      initials: initials.value,
      color,
      pixelData: `${cols}x${rows}:${halfPixels}`,
    };

    try {
      console.log("saving score...", { newScore });
      const saved = await serverDbService.saveNewScore(newScore);

      if (!saved.newScore || !saved.newScoreCounts) {
        throw new Error("Could not save score");
      }

      gameContext.game.isSaved = true;
      console.log("saved!", { saved });
      gameContext.interface.scoresModal.isShowing = true;
    } catch (err) {
      console.error(err);
    }
  });

  const computedAvatarSize = useSignal(
    limitSizeMinMax(
      (typeof window !== "undefined" ? window.innerHeight : 300) * 0.14,
    ),
  );

  useOnWindow(
    "resize",
    $(() => {
      computedAvatarSize.value = limitSizeMinMax(
        (typeof window !== "undefined" ? window.innerWidth : 300) * 0.14,
      );
      console.log("new avater size:", computedAvatarSize.value);
    }),
  );

  useVisibleTask$(() => {
    computedAvatarSize.value = limitSizeMinMax(
      (typeof window !== "undefined" ? window.innerWidth : 300) * 0.14,
    );
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
      <div class="w-full h-full max-h-[50vh] overflow-y-auto grid gap-3">
        <div class="flex gap-0.5 md:gap-1 flex-col py-[2%] px-[4%]">
          <SettingsRow>
            <div class="flex flex-grow justify-between">
              <span>Time:</span>
              <span>
                <FormattedTime timeDs={gameContext.timer.state.timeDs} />
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

        <div class={`w-full h-full`}>
          <div class="w-full flex flex-col gap-2 items-center justify-center py-[2%] px-[4%]">
            <h3 class="text-sm md:text-lg ">Avatar:</h3>
            <PixelAvatar
              width={computedAvatarSize.value}
              height={computedAvatarSize.value}
              text={identifier}
              colorFrom={initials}
              outputTo$={({ cols, rows, halfPixels, color }) => {
                data.value = `${cols}x${rows}:${halfPixels}.${color}`;
              }}
            />
          </div>
          <div class="flex py-[2%] px-[4%]">
            <SettingsRow>
              <div class="flex flex-col gap-1 items-center w-full">
                <div class="w-full text-xs md:text-sm">
                  <label
                    class="w-full flex justify-center gap-2"
                    for="game-end-modal-input-initials"
                  >
                    Username or Initials:
                  </label>
                  <input
                    disabled={gameContext.game.isSaved}
                    type="text"
                    id="game-end-modal-input-initials"
                    class={`monospace text-center bg-slate-800 text-slate-100 `}
                    style={`width: ${Math.round(CONSTANTS.GAME.INITIALS_MAX_LENGTH * 1.15)}ch;`}
                    maxLength={CONSTANTS.GAME.INITIALS_MAX_LENGTH}
                    onInput$={(e) => {
                      initials.value = (
                        e.target as HTMLInputElement
                      ).value.toUpperCase();
                    }}
                    onFocus$={selectFieldOnFocus$}
                    value={initials.value}
                  />
                </div>

                <div class="w-full text-xs md:text-sm">
                  <label for="game-end-modal-input-identifier">
                    Identifier: <Asterisk />
                  </label>
                  <button
                    data-label="generate-random-identifier"
                    onClick$={getNewHash$}
                    class="text-xs px-0 py-0 ml-2 "
                    style="color: var(--qwik-light-blue);"
                    type="button"
                    disabled={gameContext.game.isSaved}
                  >
                    (Or generate a random identifier)
                  </button>

                  <textarea
                    id="game-end-modal-input-identifier"
                    disabled={gameContext.game.isSaved}
                    class="overflow-y-hidden mx-auto px-1.5 monospace max-w-[34ch] h-[4em] md:h-[3em] block w-full bg-slate-800 text-slate-100 resize-none"
                    onFocus$={selectFieldOnFocus$}
                    bind:value={identifier}
                  />
                </div>
                <span class="text-xs text-slate-100">
                  <Asterisk /> Identifier is never saved or sent anywhere. It's
                  only to generate your avatar. If you want your avatar to be
                  consistent across games and devices, use something unique and
                  consistent like your name or email. The data is hashed and
                  used to determine pixel placement.
                </span>
              </div>
            </SettingsRow>
          </div>

          <div class="flex py-[2%] px-[4%]">
            <Button
              classes="mx-auto bg-green-600 hover:bg-green-400 disabled:bg-green-700"
              onClick$={saveScore$}
              disabled={gameContext.game.isSaved}
            >
              Save Score
            </Button>
          </div>
        </div>

        <hr />

        <div class="flex flex-col gap-2 py-[2%] px-[4%]">
          <h3 class="text-sm" style="text-shadow: 1px 1px 2px black">
            Want to play again?
          </h3>

          <SettingsRow>
            <div class="flex flex-grow gap-[2%] items-center tooltip w-full">
              <label
                class="w-4/12 text-left text-xs md:text-sm"
                for="deck-card-count-end-game"
              >
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

        <div class="flex py-[2%] px-[4%] gap-1 justify-center">
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
      </div>
    </Modal>
  );
});
const Asterisk = () => <span class="text-red-300">*</span>;
