import {
  $,
  component$,
  useComputed$,
  useOnDocument,
  useSignal,
} from "@builder.io/qwik";

import {
  useDelayedTimeoutObj,
  useIntervalObj,
  useTimeoutObj,
} from "~/v3/hooks/useTimeout";

import EndGame from "~/v3/components/pages/end-game/end-game";
import GameHeader from "~/v3/components/organisms/game-header/game-header";
import Settings from "~/v3/components/pages/settings/settings";
import Loading from "~/v3/components/pages/loading/loading";
import Board from "~/v3/components/organisms/board/board";

import { GAME } from "~/v3/constants/game";
import { BOARD } from "~/v3/constants/board";
import { useVisibilityChange } from "~/v3/hooks/useVisibilityChange/useVisibilityChange";
import type { iUserSettings } from "~/v3/types/types";
import { useGameContextProvider } from "~/v3/services/gameContext.service/gameContext.service";
import { USER_SETTINGS } from "~/v3/services/gameContext.service/initialState";
// import InverseModal from "../inverse-modal/inverse-modal";

// export const getKeysIfObject = (obj: object, prefix?: string) => {
//   const entries = Object.entries(obj);
//   let keys: String[] = [];
//
//   for (const [key, value] of entries) {
//     if (typeof value === "string") {
//       // use prefix if exists
//       keys.push(`${prefix ? prefix + "_" : ""}${key}`);
//     } else if (typeof value === "object") {
//       // pass in new prefix if exists
//       keys = keys.concat(
//         getKeysIfObject(value, `${prefix ? prefix + "_" : ""}${key}_`)
//       );
//     }
//   }
//   return keys;
// };
//
// export const keysSettings = getKeysIfObject(USER_SETTINGS);

export default component$(
  ({ settings = USER_SETTINGS }: { settings: iUserSettings }) => {
    // console.log("game component settings:", { settings });
    const containerRef = useSignal<HTMLDivElement>();

    const ctx = useGameContextProvider({
      userSettings: settings,
    });

    // /* ================================
    //  * Set up scroll detection
    //  *
    //  * ================================ */
    // useAccomodateScrollbar<HTMLDivElement>(
    //   containerRef,
    //   $(({ isElementScrollable }) => {
    //     gameContext.interface.isScrollable = isElementScrollable;
    //   })
    // );

    /* ================================
     * Shuffle on interval (for fun)
     * - gives it a nice look if you leave the tab open (and you haven't started the game)
     * ================================ */
    useIntervalObj({
      action: $(() => {
        ctx.handle.shuffleCardPositions();
      }),
      triggerCondition: useComputed$(
        () => !ctx.timer.state.isStarted && !ctx.timer.state.isEnded,
      ),
      regularInterval: GAME.AUTO_SHUFFLE_INTERVAL,
      initialDelay: GAME.AUTO_SHUFFLE_DELAY,
    });

    /* ================================
     * Handles shuffling
     * - when shuffling state > 0, we shuffle a round and then decrement
     * ================================ */
    useTimeoutObj({
      action: $(() => {
        ctx.handle.shuffleCardPositions();
        ctx.state.gameData.shufflingState -= 1;

        if (ctx.state.gameData.shufflingState <= 0) ctx.handle.stopShuffling();
      }),
      triggerCondition: useComputed$(
        () => ctx.state.gameData.shufflingState > 0,
      ),
      initialDelay:
        BOARD.CARD_SHUFFLE_PAUSE_DURATION + BOARD.CARD_SHUFFLE_ACTIVE_DURATION,
    });

    /* ================================
     * Handle Shake Animation Timers
     * - when mismatching a pair, shake the cards
     *   - wait until card is returned before starting
     * ================================ */
    useDelayedTimeoutObj({
      actionOnStart: $(() => {
        ctx.state.gameData.isShaking = true;
      }),
      actionOnEnd: $(() => {
        ctx.state.gameData.isShaking = false;
        ctx.state.gameData.mismatchPair = "";
      }),
      triggerCondition: useComputed$(
        () => ctx.state.gameData.mismatchPair !== "",
      ),
      initialDelay:
        GAME.SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD,
      interval:
        GAME.SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD +
        BOARD.CARD_SHAKE_ANIMATION_DURATION,
    });

    useVisibilityChange({
      onHidden$: $(() => {
        ctx.handle.showSettings();
      }),
    });

    useOnDocument(
      "keydown",
      $((event: KeyboardEvent) => {
        if (event.key !== "Escape") {
          return;
        }
        if (ctx.state.interfaceSettings.endOfGameModal.isShowing) {
          return;
        }
        if (ctx.state.interfaceSettings.settingsModal.isShowing) {
          ctx.handle.hideSettings();
        } else {
          ctx.handle.showSettings();
        }
      }),
    );

    return (
      <>
        {/* <InverseModal */}
        {/*   isShowing={appStore.interface.inverseSettingsModal.isShowing} */}
        {/*   hideModal$={() => { */}
        {/*     appStore.createTimestamp({paused: false}); */}
        {/*     appStore.interface.inverseSettingsModal.isShowing = false; */}
        {/*   }} */}
        {/*   title="Settings" */}
        {/* > */}
        {/*   <div */}
        {/*     q:slot="mainContent" */}
        {/*     class={`flex flex-col flex-grow justify-between w-full h-full p-[${CONTAINER_PADDING_PERCENT}%] gap-1 ${ */}
        {/*       appStore.boardLayout.isLocked ? "overflow-x-auto" : "" */}
        {/*     }`} */}
        {/*     ref={containerRef} */}
        {/*   > */}
        {/*     <GameHeader */}
        {/*       showSettings$={() => { */}
        {/*         appStore.interface.inverseSettingsModal.isShowing = true; */}
        {/*       }} */}
        {/*     /> */}
        {/**/}
        {/*     <V3Board containerRef={containerRef} /> */}
        {/*   </div> */}
        {/*   <SettingsContent q:slot="revealedContent" /> */}
        {/* </InverseModal> */}

        <div
          class={`flex flex-col flex-grow justify-between w-full h-full p-[${
            GAME.CONTAINER_PADDING_PERCENT
          }%] gap-1 ${
            ctx.state.userSettings.board.isLocked ? "overflow-x-auto" : ""
          }`}
          ref={containerRef}
        >
          <GameHeader
            showSettings$={() => {
              ctx.handle.showSettings();
            }}
          />
          <Board containerRef={containerRef} />
        </div>

        <Loading isShowing={ctx.state.gameData.isLoading} />
        <Settings />
        <EndGame />
      </>
    );
  },
);
