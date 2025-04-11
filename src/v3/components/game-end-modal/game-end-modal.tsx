import type { Signal } from "@builder.io/qwik";
import {
  component$,
  $,
  useSignal,
  useVisibleTask$,
  useTask$,
} from "@builder.io/qwik";
import PixelAvatar from "../pixel-avatar/pixel-avatar";
import Button from "../atoms/button/button";
import Modal from "../templates/modal/modal";
import type { InsertScore } from "~/v3/db/schemas/types";
import ModalRow from "../atoms/modal-row/modal-row";
import GameStats from "../molecules/game-stats/game-stats";
import InfoTooltip from "../organisms/info-tooltip/info-tooltip";
import GameSettings from "../organisms/game-settings/game-settings";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";
import serverDbService from "~/v3/services/db";
import { msToDs } from "~/v3/utils/formatTime";
import GAME from "~/v3/constants/game";
import type { iUserSettings } from "~/v3/types/types";
import { useDefaultHash } from "~/routes/game";
import useGetSavedTheme from "~/v3/hooks/useGetSavedTheme";
import useDebouncedOnWindow from "~/v3/hooks/useDebouncedOnWindow";

const limitSizeMinMax = (val: number, min: number = 60, max: number = 100) =>
  Math.max(min, Math.min(max, val));
import { getRandomBytesBrowser } from "~/v3/utils/hashUtils";

const Asterisk = () => <span class="text-red-300">*</span>;

export default component$(() => {
  const ctx = useGameContextService();
  const defaultHash = useDefaultHash();

  const hideModal$ = $(() => {
    ctx.state.interfaceSettings.endOfGameModal.isShowing = false;
  });

  const initials = useSignal("---");
  const initialsRef = useSignal<HTMLInputElement>(); // to manipulate the input
  const identifier = useSignal(defaultHash.value);
  const userId = useSignal<string | undefined>("");

  const selectFieldOnFocus$ = $(
    (_: FocusEvent, t: HTMLInputElement | HTMLTextAreaElement) => t.select(),
  );

  const saveScore$ = $(async () => {
    if (ctx.state.gameData.isSaved) return;

    const newScore: InsertScore = {
      createdAt: Date.now(),
      deckSize: ctx.state.userSettings.deck.size,
      gameTimeDs: msToDs(ctx.timer.state.time),
      mismatches: ctx.state.gameData.mismatchPairs.length,
      pairs: ctx.state.gameData.successfulPairs.length,
      userId: userId.value ?? identifier.value,
      initials: initials.value,
    };

    try {
      console.log("saving score...", { newScore });
      const saved = await serverDbService.saveNewScore(newScore);

      if (!saved.newScore || !saved.newScoreCounts) {
        throw new Error("Could not save score");
      }

      ctx.state.gameData.isSaved = true;
      console.log("saved!", { saved });
      ctx.state.interfaceSettings.scoresModal.isShowing = true;
    } catch (err) {
      console.error(err);
    }
  });

  const computedAvatarSize = useSignal(
    limitSizeMinMax(
      (typeof window !== "undefined" ? window.innerHeight : 300) * 0.14,
    ),
  );

  // do I even need to use js to calculate the avatar size??? Why not use CSS?
  //
  useDebouncedOnWindow(
    "resize",
    $(() => {
      computedAvatarSize.value = limitSizeMinMax(
        (typeof window !== "undefined" ? window.innerWidth : 300) * 0.14,
      );
      console.log("new avater size:", computedAvatarSize.value);
    }),
    100,
  );

  // resize the avatar
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    computedAvatarSize.value = limitSizeMinMax(
      (typeof window !== "undefined" ? window.innerWidth : 300) * 0.14,
    );
  });

  const unsavedUserSettings = useSignal<iUserSettings>({
    ...ctx.state.userSettings,
  });

  // sync theme with the settings
  useGetSavedTheme(
    { ctx, unsavedUserSettings },
    {
      onLoad: false,
    },
  );

  const saveOrResetSettings = $(async (newSettings?: Signal<iUserSettings>) => {
    ctx.handle.resetGame(newSettings ? newSettings.value : undefined);
    ctx.state.interfaceSettings.scoresModal.isShowing = false;
    ctx.handle.hideEndGameModal();
  });

  // resync when showing or hiding modal e.g. if home changed settings but didn't save
  useTask$(({ track }) => {
    track(() => ctx.state.interfaceSettings.scoresModal.isShowing);
    // first save interface changes without requiring save to be clicked
    // then update signal to match all state settings
    ctx.state.userSettings.interface = unsavedUserSettings.value.interface;
    unsavedUserSettings.value = ctx.state.userSettings;
  });

  return (
    <Modal
      isShowing={ctx.state.interfaceSettings.endOfGameModal.isShowing}
      hideModal$={hideModal$}
      title={
        ctx.state.interfaceSettings.endOfGameModal.isWin
          ? "You Win!"
          : "Game Over"
      }
      options={{
        detectClickOutside: false,
      }}
    >
      <div class="w-full h-full max-h-[50vh] overflow-y-auto grid gap-3">
        <div class="flex gap-0.5 md:gap-1 flex-col py-[2%] px-[4%]">
          <GameStats />

          {/*
          <ModalRow>
            <div class="flex flex-grow justify-between">
              <span>Time:</span>
              <span>
                <FormattedTime timeMs={ctx.timer.state.time} />
              </span>
            </div>
          </ModalRow>
          <ModalRow>
            <div class="flex flex-grow justify-between">
              <span>Pairs:</span>
              <span>
                {ctx.state.gameData.successfulPairs.length}/
                {ctx.state.userSettings.deck.size / 2}
              </span>
            </div>
          </ModalRow>
          <ModalRow>
            <div class="flex flex-grow justify-between">
              <span>Mismatches:</span>
              <span>
                {ctx.state.gameData.mismatchPairs.length}
                {ctx.state.userSettings.maxAllowableMismatches !== -1
                  ? `/${ctx.state.userSettings.deck.size / 2} `
                  : ""}
              </span>
            </div>
          </ModalRow>
*/}
        </div>

        <hr class="mx-2 border-slate-800 opacity-50" />

        <div class={`w-full h-full`}>
          <div class="w-full flex flex-col gap-2 items-center justify-center py-[2%] px-[4%]">
            <h3 class="text-sm md:text-lg ">Avatar:</h3>
            <PixelAvatar
              width={computedAvatarSize.value} // do i really need js to set size???
              height={computedAvatarSize.value}
              text={identifier}
              colorFrom={initials}
              outputTo$={({ hash }) => {
                userId.value = hash;
              }}
            />
          </div>
          <div class="flex py-[2%] px-[4%]">
            <ModalRow>
              <div class="flex flex-col gap-4 items-center w-full">
                <div class="w-full text-xs md:text-sm flex flex-col">
                  <label
                    class="w-full flex justify-center gap-2"
                    for="game-end-modal-input-initials"
                  >
                    Initials:
                  </label>
                  <input
                    ref={initialsRef}
                    disabled={ctx.state.gameData.isSaved}
                    type="text"
                    id="game-end-modal-input-initials"
                    class={`monospace text-center bg-slate-800 text-slate-100 mx-auto`}
                    style={`width: ${GAME.INITIALS_MAX_LENGTH * 2.5}ch;`}
                    maxLength={GAME.INITIALS_MAX_LENGTH + 1}
                    defaultValue={initials.value}
                    onInput$={(_: Event, t: HTMLInputElement) => {
                      const prev = t.value.replaceAll("-", "").toUpperCase();
                      const newString =
                        prev.length > GAME.INITIALS_MAX_LENGTH
                          ? prev.slice(0, GAME.INITIALS_MAX_LENGTH)
                          : prev.padStart(3, "-");
                      (initialsRef.value as HTMLInputElement).value = newString;
                    }}
                    onFocus$={selectFieldOnFocus$}
                  />
                </div>

                <div class="flex flex-col w-full text-xs md:text-sm">
                  <label
                    for="game-end-modal-input-identifier "
                    class="flex gap-[0.2em] items-center mx-auto"
                  >
                    Identifier:
                    <Asterisk />
                    <InfoTooltip>
                      <Asterisk /> Identifier is never saved or sent anywhere.
                      It's only to generate your avatar. If you want your avatar
                      to be consistent across games and devices, use something
                      unique and consistent like your name or email. The data is
                      hashed and used to determine pixel placement.
                    </InfoTooltip>
                  </label>
                  <button
                    data-label="generate-random-identifier"
                    onClick$={async () => {
                      identifier.value = getRandomBytesBrowser();
                    }}
                    class="text-xs px-0 py-0 "
                    style="color: var(--qwik-light-blue);"
                    type="button"
                    disabled={ctx.state.gameData.isSaved}
                  >
                    (Or generate a random identifier)
                  </button>

                  <textarea
                    id="game-end-modal-input-identifier"
                    disabled={ctx.state.gameData.isSaved}
                    class="overflow-y-hidden mx-auto px-1.5 monospace max-w-[34ch] h-[4em] md:h-[3em] block w-full bg-slate-800 text-slate-100 resize-none"
                    onFocus$={selectFieldOnFocus$}
                    bind:value={identifier}
                  />
                </div>
              </div>
            </ModalRow>
          </div>

          <div class="flex py-[2%] px-[4%]">
            <Button
              classes="mx-auto bg-green-600 hover:bg-green-400 disabled:bg-green-700"
              onClick$={saveScore$}
              disabled={ctx.state.gameData.isSaved}
            >
              Save Score
            </Button>
          </div>
        </div>

        <hr class="mx-2 border-slate-800 opacity-50" />

        <GameSettings unsavedUserSettings={unsavedUserSettings}>
          <div
            q:slot="footer"
            class="mt-5 flex flex-grow items-center justify-around"
          >
            <Button onClick$={hideModal$}>
              <span class="text-slate-100">Close</span>
            </Button>
            <Button
              onClick$={() => {
                saveOrResetSettings(unsavedUserSettings);
              }}
            >
              <span class="text-slate-100">Play Again</span>
            </Button>
          </div>
        </GameSettings>

        {/*
        <div class="flex flex-col gap-2 py-[2%] px-[4%]">
          <h3 class="text-sm" style="text-shadow: 1px 1px 2px black">
            Want to play again?
          </h3>

          <ModalRow>
            <DeckSizeChanger
              userSettings={unsavedUserSettings}
              isLocked={unsavedUserSettings.value.deck.isLocked}
              for="game-settings"
            />
          </ModalRow>
        </div>

        <div class="flex py-[2%] px-[4%] gap-1 justify-center">
          <Button
            onClick$={() => {
              ctx.handle.resetGame(unsavedUserSettings.value);

              ctx.state.interfaceSettings.endOfGameModal.isShowing = false;
            }}
          >
            Play Again
          </Button>
          <Button onClick$={hideModal$}>Close</Button>
        </div>
*/}
      </div>
    </Modal>
  );
});
