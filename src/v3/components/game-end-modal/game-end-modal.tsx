import {
  component$,
  $,
  useContext,
  useSignal,
  QwikFocusEvent,
  useOnWindow,
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
import CONSTANTS from "~/v3/utils/constants";

const getRandomBytes = server$((bytes: number = CONSTANTS.GAME.HASH_LENGTH_BYTES) => {
  return crypto.randomBytes(bytes).toString("hex");
});

export function bufferToHexString(byteArray: Uint8Array) {
  let hexCodes = [...byteArray].map((value) => {
    return value.toString(16).padStart(2, "0");
  });

  return hexCodes.join("");
}

export const serverGetHash = server$(function(
  message: string,
  bytes: number = CONSTANTS.GAME.HASH_LENGTH_BYTES
) {
  return crypto
    .createHash("sha256")
    .update(message)
    .digest("hex")
    .substring(0, bytes);
});

const computeAvatarSize = (val: number) =>
  Math.max(40,
    Math.min(100,
      val
    )
  );

export default component$(() => {
  const gameContext = useContext(GameContext);
  const defaultHash = useDefaultHash();
  const data = useSignal('');

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
    if (gameContext.game.isSaved) return;
    const [pixels, color] = data.value.split('.');
    const newScore: NewScore = {
      deckSize: gameContext.settings.deck.size,
      gameTime: `${gameContext.timer.state.timeDs} millisecond`,
      mismatches: gameContext.game.mismatchPairs.length,
      pairs: gameContext.game.successfulPairs.length,
      userId: identifier.value,
      initials: initials.value,
      color,
      pixels,
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
    computeAvatarSize((typeof window !== 'undefined'
      ? window.innerHeight
      : 500) / 10
    )
  );

  useOnWindow('resize', $(() => {
    computedAvatarSize.value = computeAvatarSize((typeof window !== 'undefined'
      ? window.innerHeight
      : 500) / 10
    );
    console.log('new avater size:', computedAvatarSize.value);
  }));

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
      <div class="w-full h-full max-h-[50vh] overflow-y-auto">
        <div class="flex gap-0.5 md:gap-1 flex-col py-[2%] px-[4%]">
          <SettingsRow>
            <div class="flex flex-grow justify-between">
              <span>Time:</span>
              <span>
                <FormattedTime
                  timeMs={gameContext.timer.state.timeDs}
                  limit={1}
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

        <hr class={gameContext.game.isSaved ? 'hidden' : ''} />

        <div class={`w-full h-full ${gameContext.game.isSaved ? 'hidden' : ''}`}>
          <div class="w-full flex justify-center py-[2%] px-[4%]">
            <PixelAvatar
              width={computedAvatarSize.value}
              height={computedAvatarSize.value}

              text={identifier}
              colorFrom={initials}
              outputTo$={({ pixels, color }) => { data.value = `${pixels}.${color}` }}
            />
          </div>
          <div class="flex py-[2%] px-[4%]">
            <SettingsRow>
              <div class="flex flex-col gap-1 items-center w-full">
                <label class="w-full flex justify-center gap-2">
                  Initials:
                  <input
                    disabled={gameContext.game.isSaved}
                    type="text"
                    class="ml-2 text-center w-[5ch] bg-slate-800 text-slate-100"
                    maxLength={3}
                    onInput$={(e) => {
                      initials.value = (
                        e.target as HTMLInputElement
                      ).value.toUpperCase();
                    }}
                    onFocus$={selectFieldOnFocus$}
                    value={initials.value}
                  />
                </label>
                <label class="text-xs w-full">
                  Identifier:
                  <input
                    disabled={gameContext.game.isSaved}
                    type="text"
                    class="block w-full bg-slate-800 text-slate-100"
                    onFocus$={selectFieldOnFocus$}
                    bind: value={identifier}
                  />
                </label>
                <Button
                  classes=""
                  onClick$={getNewHash$}
                  disabled={gameContext.game.isSaved}
                >
                  Generate Random Identifier
                </Button>
                <span class="text-xs">
                  Identifier is never saved or sent anywhere. It's only to
                  generate your avatar. Use something unique and consistent
                  like your name or email if you want your avatar to be
                  consistent across games and devices.
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
                bind: value={cardCount}
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
          <Button onClick$={hideModal$} >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
});
