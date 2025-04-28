import { component$, $, useSignal, sync$ } from "@builder.io/qwik";
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
import { useDefaultHash } from "~/routes/game";
import { getRandomBytesBrowser } from "~/v3/utils/hashUtils";
import { selectFieldOnFocus$ } from "~/v3/handlers/handlers";
import useSyncedSettings from "~/v3/hooks/useSyncedSettings";
import { FONT_SIZES } from "~/v3/constants/styles";

const Asterisk = () => <span class="text-red-300">*</span>;

export default component$(() => {
  const { unsavedUserSettings, saveOrResetSettings$, ctx, scrollToTopRef } =
    useSyncedSettings("endOfGameModal");
  const defaultHash = useDefaultHash();

  const touchedFields = useSignal<string[]>([]);
  const markTouched$ = $((_: Event, t: HTMLElement) => {
    if (touchedFields.value.includes(t.tagName)) return;
    touchedFields.value = [...touchedFields.value, t.tagName];
  });

  const initials = useSignal("---");
  const initialsRef = useSignal<HTMLInputElement>(); // to manipulate the input
  const identifier = useSignal(defaultHash.value);
  const userId = useSignal<string | undefined>("");
  const saveState = useSignal<"idle" | "loading" | "error">("idle");

  const saveScore$ = $(async () => {
    if (ctx.state.gameData.IS_SCORES_ENABLED === false) return;
    if (ctx.state.gameData.isSaved) return;

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

  return (
    <Modal
      isShowing={ctx.state.interfaceSettings.endOfGameModal.isShowing}
      hideModal$={ctx.handle.hideEndOfGameModal}
      title={
        ctx.state.interfaceSettings.endOfGameModal.isWin
          ? "You Win!"
          : "Game Over"
      }
      options={{
        detectClickOutside: false,
      }}
      wrapperSyles={{ overflowY: "hidden" }}
    >
      <div
        ref={scrollToTopRef}
        class="w-full h-full max-h-[50vh] overflow-y-auto grid gap-3"
      >
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

        {ctx.state.gameData.IS_SCORES_ENABLED && (
          <>
            <hr class="mx-2 border-slate-800 opacity-50" />

            <div
              class={`w-full h-full rounded-lg ${ctx.state.gameData.isSaved ? "bg-slate-700/50" : "bg-slate-600"}`}
            >
              <div class="w-full flex flex-col gap-2 items-center justify-center py-[2%] px-[4%]">
                <h3 class={FONT_SIZES.STANDARD}>Avatar:</h3>
                <PixelAvatar
                  classes="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px]"
                  text={identifier}
                  colorFrom={initials}
                  outputTo$={({ hash }) => {
                    // let PixelAvatar hash it so we don't have to hash twice
                    userId.value = hash;
                  }}
                />
              </div>
              <div class="flex py-[2%] px-[4%]">
                <ModalRow>
                  <div class="flex flex-col gap-4 items-center w-full">
                    <div class={`w-full ${FONT_SIZES.SMALL} flex flex-col`}>
                      <label
                        class="w-full flex justify-center gap-2"
                        for="game-end-modal-input-initials"
                      >
                        Initials:
                      </label>
                      <input
                        ref={initialsRef}
                        type="text"
                        id="game-end-modal-input-initials"
                        class={`monospace text-center bg-slate-800 text-slate-100 mx-auto`}
                        onFocus$={[selectFieldOnFocus$, markTouched$]}
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
                    </div>

                    <div class={`flex flex-col w-full ${FONT_SIZES.SMALL}`}>
                      <label
                        for="game-end-modal-input-identifier "
                        class="flex gap-[0.2em] items-center mx-auto"
                      >
                        Identifier:
                        <Asterisk />
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
                        data-label="generate-random-identifier"
                        onClick$={() => {
                          identifier.value = getRandomBytesBrowser();
                        }}
                        class="text-xs px-0 py-0 "
                        style="color: var(--qwik-light-blue);"
                        type="button"
                      >
                        (Or generate a random identifier)
                      </button>

                      <textarea
                        name="email"
                        autocomplete="email"
                        id="game-end-modal-input-identifier"
                        class="overflow-y-hidden mx-auto px-1.5 monospace max-w-[34ch] h-[4em] md:h-[3em] block w-full bg-slate-800 text-slate-100 resize-none"
                        onFocus$={[selectFieldOnFocus$, markTouched$]}
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
                  classes={`mx-auto ${
                    ctx.state.gameData.isSaved ? "!bg-green-600" : ""
                  }`}
                  onClick$={saveScore$}
                  disabled={
                    touchedFields.value.length < 2 ||
                    ctx.state.gameData.isSaved ||
                    saveState.value === "loading"
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
                <div class="absolute left-[calc(50%+0.5rem+2.75em)] top-[calc(50%-0.25em-0.5rem)]">
                  <InfoTooltip>
                    <div class="max-w-[18em]">
                      Touch both fields before saving. 
                      <br />
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
        <Button onClick$={ctx.handle.hideEndOfGameModal}>
          <span class="text-slate-100">Close</span>
        </Button>
        <Button
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
