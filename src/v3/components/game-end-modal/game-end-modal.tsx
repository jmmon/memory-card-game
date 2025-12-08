import { component$, $, useSignal, sync$, useTask$, useVisibleTask$ } from "@builder.io/qwik";
import PixelAvatar from "../pixel-avatar/pixel-avatar";
import Button from "../atoms/button/button";
import Modal from "../templates/modal/modal";
import type { InsertScore } from "~/v3/db/schemas/types";
import ModalRow from "../atoms/modal-row/modal-row";
import GameStats from "../molecules/game-stats/game-stats";
import InfoTooltip from "../organisms/info-tooltip/info-tooltip";
import GameSettings from "../organisms/game-settings/game-settings";
import serverDbService from "~/v3/services/db";
import { msToDs } from "~/v3/utils/formatTime";
import GAME from "~/v3/constants/game";
import { getRandomBytesBrowser, getRandomBytesServer } from "~/v3/utils/hashUtils";
import { selectFieldOnFocus$ } from "~/v3/handlers/handlers";
import useSyncedSettings from "~/v3/hooks/useSyncedSettings";
import { FONT_SIZES } from "~/v3/constants/styles";
import ModalHeader from "../molecules/modal-header/modal-header";
import storageService from "~/v3/services/storage.service";
type ConfettiOpts = Partial<{
  /** default is 50 */
  particleCount: number;
  /** 90 is straight up */
  angle: number;
  /** default 45: e.g. +- 22.5 degrees from the angle */
  spread: number;
  /** default 45: how many pixels rate confetti will start at */
  startVelocity: number;
  /** default 0.9: how fast they will lose speed (range: 0-1) */
  decay: number;
  /** default 1: how fast they will fall (1 is regular gravity, 0.5 is half gravity, -1 is falling up) */
  gravity: number;
  /** default: 0: negative will drift left, positive will drift right */
  drift: number;
  /** default false: if true removes the wobble and tilt */
  flat: boolean;
  /** default 200: how many times confetti will move; play with it if they disappear too fast */
  ticks: number;
  /** default {x: 0.5, y: 0.5}: aka center of screen */
  origin: Partial<{x: number, y: number}>;
  /** hex format color strings to use for confetti */
  colors: string[];
  /** `square`, `circle`, `star`, or custom shapes, for the confetti. Can change ratio e.g. [`square`, `square`, `circle`] */
  shapes: string[];
  /** default 1: scale factor for confetti size */
  scalar: number;
  /** default 100: adjust if needed */
  zIndex: number;
  /** default false: disables for reduced motion */
  disableForReducedMotion: boolean;
}>

export default component$(() => {
  const { unsavedUserSettings, saveOrResetSettings$, ctx, scrollToTopRef } =
    useSyncedSettings("endOfGameModal");
  const defaultHash = getRandomBytesServer();

  const touchedFields = useSignal<string[]>([]);

  const initials = useSignal("---");
  const initialsRef = useSignal<HTMLInputElement>(); // to manipulate the input
  const identifier = useSignal(defaultHash);
  // for after hashing, this is actually submitted to the score
  const userId = useSignal<string | undefined>("");
  const saveState = useSignal<"idle" | "loading" | "error">("idle");

  // load user data from localStorage if exists
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const data = storageService.getJson<{identifier: string, userId: string, initials: string}>("score-identifier-data");
    if (!data) return;

    identifier.value = data.identifier;
    userId.value = data.userId;
    initials.value = data.initials;
    initialsRef.value!.value = initials.value;
  });

  const saveScore$ = $(async () => {
    if (ctx.state.gameData.IS_SCORES_ENABLED === false) return;
    if (ctx.state.gameData.isSaved || saveState.value === "loading") return;

    saveState.value = "loading";
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
      // console.log("saving score...", { newScore });
      const saved = await serverDbService.saveNewScore(newScore);

      if (!saved.newScore || !saved.newScoreCounts) {
        throw new Error("Could not save score");
      }

      // save user data into localStorage for prefilling next time
      storageService.setJson("score-identifier-data", {
        identifier: identifier.value,
        userId: saved.newScore.userId,
        initials: saved.newScore.initials,
      });

      ctx.state.gameData.isSaved = true;
      // console.log("saved!", { saved });
      ctx.handle.showScoresModal();
      saveState.value = "idle";
      touchedFields.value.length = 0;
      // don't close end of game modal, so after closing scores can hit Play Again
    } catch (err) {
      saveState.value = "error";
      console.error(err);
    }
  });

  const timeouts = useSignal<ReturnType<typeof setTimeout>[]>([]);
  const confettiOptions = {
    spread: 360,
    ticks: 70,
    gravity: 1.5,
    decay: 0.95,
    startVelocity: 30,
    colors: ["006ce9", "ac7ff4", "18b6f6", "713fc2", "ffffff"],
    // origin: {
    //   x: 0.5,
    //   y: 0.35,
    // },
  };

  const shootConfetti = $(() => {
    const confetti = ((globalThis as any).confetti as (opts: ConfettiOpts) => void);
    // library is loaded in layout
    confetti({
      ...confettiOptions,
      particleCount: 80,
      scalar: 1.2,
      origin: {
        x: Math.random() * 0.5 + 0.25,
        y: Math.random() * 0.5 + 0.1,
      }
    });

    confetti({
      ...confettiOptions,
      particleCount: 60,
      scalar: 0.75,
      origin: {
        x: Math.random() * 0.5 + 0.25,
        y: Math.random() * 0.5 + 0.1,
      }
    });
  });

  const launchConfetti = $(() => {
    // clean up last confetti timers
    timeouts.value.forEach(t => clearTimeout(t));
    timeouts.value = [
      setTimeout(shootConfetti, 0),
      setTimeout(shootConfetti, 100),
      setTimeout(shootConfetti, 200),
      setTimeout(shootConfetti, 400),
      setTimeout(shootConfetti, 550),
    ];
  });

  const sideConfetti = $(() => {
    const confetti = ((globalThis as any).confetti as (opts: ConfettiOpts) => void);
    const duration = 2 * 1000;
    const end = Date.now() + duration;

    const width = document.documentElement.clientWidth;
    const ANGLE_MAX_OFF_90 = 5;
    const SCREEN_MIN = 400;
    const SCREEN_MAX = 1920;
    const ANGLE_RANGE = 30;
    const SCREEN_RANGE = SCREEN_MAX - SCREEN_MIN;

    const widthRatioBounded = Math.max(
      0,
      Math.min(
        1,
        ((width - SCREEN_MIN) / SCREEN_RANGE)
      )
    );

    // reduce on wider screens (lower angle)
    const left = 90 -  (ANGLE_MAX_OFF_90 + (widthRatioBounded * ANGLE_RANGE));

    const right = 90 + (ANGLE_MAX_OFF_90 + (widthRatioBounded * ANGLE_RANGE));
    
    // increase on wider screens
    const SPREAD_MAX = 55;
    const SPREAD_MIN = 25;
    const SPREAD = SPREAD_MAX - ((1 - widthRatioBounded) * (SPREAD_MAX - SPREAD_MIN));

    // increase on wider screens
    const PARTICLE_MAX = 8;
    const PARTICLE_MIN = 4;
    const PARTICLE_COUNT = PARTICLE_MAX - Math.round((1 - widthRatioBounded) * (PARTICLE_MAX - PARTICLE_MIN));

    // increase on wider screens
    const VELOCITY_MAX = 62;
    const VELOCITY_MIN = 42;
    const START_VELOCITY = VELOCITY_MAX - ((1 - widthRatioBounded) * (VELOCITY_MAX - VELOCITY_MIN));

    const DRIFT_MAX = 1;
    const DRIFT_MIN = 0.5;
    const DRIFT = DRIFT_MAX - ((1 - widthRatioBounded) * (DRIFT_MAX - DRIFT_MIN));
    const DRIFT_OFFSET = DRIFT / 2;

    // TODO: play with ticks? increase on taller screens

    (function frame() {
      // launch a few confetti from the left edge
      confetti({
        particleCount: PARTICLE_COUNT,
        angle: left,
        spread: SPREAD,
        origin: { x: 0 },
        startVelocity: START_VELOCITY,
        drift: Math.random() * DRIFT - DRIFT_OFFSET,
      });
      // and launch a few from the right edge
      confetti({
        particleCount: PARTICLE_COUNT,
        angle: right,
        spread: SPREAD,
        origin: { x: 1 },
        startVelocity: START_VELOCITY,
        drift: Math.random() * DRIFT - DRIFT_OFFSET,
      });

      // keep going until we are out of time
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  })

  const BUNCH_OF_CLICKS_DURATION_MS = 1000;
  const timestamps = useSignal<number[]>([]);
  const handleBunchOfClicksConfetti = $(() => {
    const now = Date.now();
    const oldestAllowed = now - BUNCH_OF_CLICKS_DURATION_MS;

    const _timestamps = timestamps.value;
    timestamps.value = [
      ..._timestamps.filter(t => t >= oldestAllowed),
      now
    ];

    if (timestamps.value.length >= 5) {
      sideConfetti();
      timestamps.value.length = 0;
    }
  });


  useTask$(async ({track}) => {
    track(() => ctx.state.interfaceSettings.endOfGameModal.isShowing);
    if (
      !ctx.state.interfaceSettings.endOfGameModal.isShowing
      || !ctx.state.interfaceSettings.endOfGameModal.isWin
    ) {
      return;
    }

    launchConfetti();
  });

  return (
    <Modal
      isShowing={ctx.state.interfaceSettings.endOfGameModal.isShowing}
      hideModal$={ctx.handle.hideEndOfGameModal}
      options={{
        detectClickOutside: false,
      }}
      wrapperSyles={{ overflowY: "hidden" }}
    >
      <ModalHeader 
        q:slot="header"
        hideModal$={ctx.handle.hideEndOfGameModal}
        title={
          ctx.state.interfaceSettings.endOfGameModal.isWin
            ? "You Win!"
            : "Game Over"
        }
        autofocus={true}
        isShowing={ctx.state.interfaceSettings.endOfGameModal.isShowing}
      />

      <div
        ref={scrollToTopRef}
        class="w-full h-full max-h-[50vh] overflow-y-auto grid gap-3"
      >
        <div class="flex gap-0.5 md:gap-1 flex-col py-[2%] px-[4%]">
          <GameStats />
        </div>

        {ctx.state.gameData.IS_SCORES_ENABLED && (
          <>
            <hr class="mx-2 border-slate-800 opacity-50" />

            <div
              class={`w-full h-full rounded-lg ${ctx.state.gameData.isSaved ? "bg-slate-700/50" : "bg-slate-600"}`}
            >
              <div class="flex py-[2%] px-[4%]">
                <ModalRow>
                  <div class="flex flex-col gap-6 items-center w-full">
                    <div class="flex flex-col gap-1 items-center w-full">
                      <label class={FONT_SIZES.SMALL}>Avatar:</label>
                      <button
                        type="button"
                        class="border-none bg-none p-0"
                        onClick$={() => {
                          if (ctx.state.interfaceSettings.endOfGameModal.isWin) {
                            shootConfetti();
                            handleBunchOfClicksConfetti();
                          }
                        }}
                      >
                        <PixelAvatar
                          class="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px]"
                          identifierText={identifier}
                          colorFrom={initials}
                          outputTo$={({ identifierHash: hash }) => {
                            // let PixelAvatar hash it so we don't have to hash twice
                            userId.value = hash;
                          }}
                        />
                      </button>
                    </div>

                    <div class={`w-full grid grid-cols-[128px_1fr] gap-2 gap-y-4 ${FONT_SIZES.SMALL}`}>
                      <label
                        class={`w-full`}
                        for="game-end-modal-input-initials"
                      >
                        Initials:
                      </label>

                      <input
                        ref={initialsRef}
                        type="text"
                        id="initials"
                        class={`font-mono text-center bg-slate-800 text-slate-100 ${FONT_SIZES.XL}`}
                        onFocus$={[
                          selectFieldOnFocus$,
                          // markTouched$
                        ]}
                        style={`width: ${GAME.INITIALS_MAX_LENGTH * 2.5}ch;`}
                        maxLength={GAME.INITIALS_MAX_LENGTH + 1} // needed the extra length??
                        defaultValue={initials.value}
                        onInput$={(_: Event, t: HTMLInputElement) => {
                          const prev = t.value
                            .replaceAll("-", "")
                            .toUpperCase();
                          const newString =
                            prev.length > GAME.INITIALS_MAX_LENGTH
                              ? prev.slice(0, GAME.INITIALS_MAX_LENGTH)
                              : prev.padStart(3, "-");
                          // force replace value using ref
                          initialsRef.value!.value = newString;
                          initials.value = newString;
                          saveState.value = "idle";
                        }}
                      />


                      <div class="flex flex-col gap-2 ">
                        <label
                          for="game-end-modal-input-identifier "
                          class={`flex gap-[0.2em] items-center mx-auto`}
                        >
                          Identifier:
                          <InfoTooltip>
                            <div class="max-w-[18em]">
                              Identifier is never saved or sent anywhere. It's
                              only to generate your avatar. If you want your
                              avatar to be consistent across games and devices,
                              use something unique and consistent like your name
                              or email. The data is hashed and used to determine
                              pixel placement.
                            </div>
                          </InfoTooltip>
                        </label>

                        <button
                          type="button"
                          data-label="generate-random-identifier"
                          onClick$={() => {
                            identifier.value = getRandomBytesBrowser();
                          }}
                          class="text-xs px-2 py-1 text-slate-100 underline bg-[var(--qwik-light-blue)] bg-opacity-50 rounded-md mx-auto"
                        >
                          (Or generate a random identifier)
                        </button>
                      </div>

                      <textarea
                        name="email"
                        autocomplete="email"
                        id="email"
                        class="px-1.5 font-mono max-w-[34ch] h-[6em] md:h-[6em] block w-full bg-slate-800 text-slate-100 resize-none"
                        onFocus$={[
                          selectFieldOnFocus$,
                          // markTouched$
                        ]}
                        bind:value={identifier}
                        onKeyDown$={sync$((event: KeyboardEvent) => {
                          // shift+enter to submit!
                          saveState.value = "idle";
                          if (event.key === "Enter" && event.shiftKey) {
                            saveScore$();
                            event.preventDefault();
                          }
                        })}
                      />

                    </div>

                  </div>
                </ModalRow>
              </div>

              <div class="flex py-[2%] px-[4%] relative">
                <Button
                  type="button"
                  class={`mx-auto ${
                    ctx.state.gameData.isSaved ? "!bg-green-600" : ""
                  } ${FONT_SIZES.STANDARD} p-3 px-4`}
                  onClick$={saveScore$}
                  disabled={
                    ctx.state.gameData.isSaved || saveState.value === "loading"
                  }
                >
                  {saveState.value === "error"
                    ? "Try again"
                    : saveState.value === "loading"
                      ? "Saving..."
                      : ctx.state.gameData.isSaved
                        ? "Saved!"
                        : "Save Score"}
                </Button>
                <div class="absolute left-[calc(50%+1.5rem+2.75em)] top-[calc(50%-0.25em-0.5rem)]">
                  <InfoTooltip>
                    <div class="max-w-[18em]">
                      Hint: Shift-Enter in the textbox to save.
                    </div>
                  </InfoTooltip>
                </div>
              </div>
            </div>

            <hr class="mx-2 border-slate-800 opacity-50" />
          </>
        )}

        <GameSettings unsavedUserSettings={unsavedUserSettings} />
      </div>

      <div
        q:slot="footer"
        class="mt-5 flex flex-grow items-center justify-around"
      >
        <Button
          type="button"
          onClick$={ctx.handle.hideEndOfGameModal}
        >
          <span class="text-slate-100">Close</span>
        </Button>
        <Button
          type="button"
          onClick$={() => {
            saveOrResetSettings$(unsavedUserSettings);
          }}
        >
          <span class="text-slate-100">Play Again</span>
        </Button>
      </div>
    </Modal>
  );
});
