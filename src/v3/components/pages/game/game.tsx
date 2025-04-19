import { $, component$, isServer, useComputed$, useOnDocument, useSignal, useTask$ } from "@builder.io/qwik";

import {
  useDelayedTimeoutObj,
  useIntervalObj,
  useOccurrencesInterval,
  useTimeoutObj,
} from "~/v3/hooks/useTimeout";

import EndGame from "~/v3/components/pages/end-game/end-game";
import GameHeader from "~/v3/components/organisms/game-header/game-header";
import Settings from "~/v3/components/pages/settings/settings";
import Loading from "~/v3/components/pages/loading/loading";
import Board from "~/v3/components/organisms/board/board";

import GAME, { DebugTypeEnum, LogLevel } from "~/v3/constants/game";
import BOARD from "~/v3/constants/board";
import { useVisibilityChange } from "~/v3/hooks/useVisibilityChange/useVisibilityChange";
import { useGameContextProvider } from "~/v3/services/gameContext.service/gameContext.service";
import INITIAL_STATE from "~/v3/services/gameContext.service/initialState";
import type { iUserSettings } from "~/v3/types/types";
import { header } from "~/v3/constants/header-constants";
import logger from "~/v3/services/logger";
import { useLocation } from "@builder.io/qwik-city";
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
// export const keysSettings = getKeysIfObject(INITIAL_STATE.userSettings);

type GameProps = { settings: Partial<iUserSettings> };
export default component$<GameProps>(
  ({ settings = INITIAL_STATE.userSettings }) => {
    const loc = useLocation();
    // console.log("game component settings:", { settings });
    const ctx = useGameContextProvider({
      userSettings: settings,
      // make sure state is cleared if going back/forward
      // else the cards will be on the board before it starts the deck deal animation
      ...(loc.prevUrl?.pathname === "/"
        ? {
            gameData: {
              cards: [], 
            },
          }
        : {}),
    });

    /* ================================
     * Deal the deck animation
     * - runs the fan out card animation, timeout per each round
     * ================================ */
    useOccurrencesInterval({
      triggerCondition: useComputed$(
        () =>
          ctx.state.gameData.dealCardIndex === ctx.state.userSettings.deck.size,
      ),
      interval: useComputed$(
        () =>
          GAME.FAN_OUT_DURATION_BASE_MS / ctx.state.userSettings.deck.size +
          GAME.FAN_OUT_DURATION_ADDITIONAL_PER_CARD_MS,
      ),
      intervalAction: ctx.handle.dealCard,
      occurrences: useComputed$(() => ctx.state.userSettings.deck.size),
      endingActionDelay: 250,
      endingAction: ctx.handle.startShuffling,
      runImmediatelyOnCondition: false,
    });

    /* ================================
     * Handles shuffling rounds
     * - runs when isShuffling (after startShuffling is called)
     * ================================ */
    useOccurrencesInterval({
      triggerCondition: useComputed$(
        () =>
          ctx.state.gameData.dealCardIndex === 0 &&
          ctx.state.gameData.isShuffling === true,
      ),
      interval: useComputed$(
        () =>
          BOARD.CARD_SHUFFLE_PAUSE_DURATION +
          BOARD.CARD_SHUFFLE_ACTIVE_DURATION,
      ),
      intervalAction: ctx.handle.shuffleCardPositions,
      occurrences: useComputed$(() => ctx.state.gameData.shuffleRounds),
      endingAction: ctx.handle.stopShuffling,
      runImmediatelyOnCondition: true,
    });

    /* ================================
     * Shuffle on interval (for fun)
     * - gives it a nice look if you leave the tab open (and you haven't started the game)
     * ================================ */
    useIntervalObj({
      triggerCondition: useComputed$(
        () =>
          ctx.state.gameData.dealCardIndex === 0 &&
          !ctx.state.gameData.isShuffling &&
          !ctx.state.gameData.isLoading &&
          !ctx.timer.state.isStarted &&
          !ctx.timer.state.isEnded,
      ),
      initialDelay: GAME.AUTO_SHUFFLE_DELAY,
      interval: GAME.AUTO_SHUFFLE_INTERVAL,
      action: ctx.handle.shuffleCardPositions,
    });


    /* ================================
     * Handle Shake Animation Timers
     * - when mismatching a pair, shake the cards
     *   - wait until card is returned before starting
     * ================================ */
    useDelayedTimeoutObj({
      triggerCondition: useComputed$(
        () => ctx.state.gameData.mismatchPair !== "",
      ),
      initialDelay:
        GAME.SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD, // e.g. 275ms
      interval:
        GAME.SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD +
        BOARD.CARD_SHAKE_ANIMATION_DURATION, // e.g. 275 + 600 = 875ms
      actionOnStart: $(() => {
        ctx.state.gameData.isShaking = true;
      }),
      actionOnEnd: $(() => {
        ctx.state.gameData.isShaking = false;
        ctx.state.gameData.mismatchPair = "";
      }),
    });

    /* ================================
     * Handle Header Score counter animations reset
     * - when mismatching a pair, pop out the score pairs or mismatches
     *
     * probably don't need both of these timeouts?
     * reset animations, turn them off
     *    - can do both animations at same time since only one will trigger per pair selection
     * ================================ */
    useTimeoutObj({
      triggerCondition: useComputed$(
        () =>
          ctx.state.interfaceSettings.successAnimation === true ||
          ctx.state.interfaceSettings.mismatchAnimation === true,
      ),
      delay: header.COUNTER_ANIMATE_DURATION,
      action: $(() => {
        ctx.state.interfaceSettings.mismatchAnimation = false;
        ctx.state.interfaceSettings.successAnimation = false;
      }),
    });

    // auto pause game after some inactivity (in case you go away)
    useTimeoutObj({
      triggerCondition: useComputed$(
        () =>
          !ctx.state.interfaceSettings.settingsModal.isShowing &&
          !ctx.state.interfaceSettings.endOfGameModal.isShowing &&
          ctx.timer.state.isStarted &&
          !ctx.timer.state.isEnded &&
          ctx.state.gameData.lastClick !== -1, // if clicked recently, will be not -1
      ),
      delay: GAME.AUTO_PAUSE_DELAY_MS,
      action: ctx.handle.showSettings,
      checkConditionOnTimeout: true,
    });

    // when switching tabs, show settings to pause the game
    useVisibilityChange({
      onHidden$: ctx.handle.showSettings,
    });

    useOnDocument(
      "keydown",
      $((event: KeyboardEvent) => {
        if (event.key !== "Escape") return;

        // smart modal toggle, if game is ended toggle end-game modal
        // else toggle settings
        ctx.handle.toggleModalOnEscape();
      }),
    );

    // when modal is open and then browser back - forward,
    // prevents modal from showing and closing initially
    // - shuffle animation triggers isLoading so modals are immediately available
    // after initial render, and properly render as hidden
    const hasInitialized = useSignal(false);
    useTask$(({track}) => {
      track(() => ctx.state.gameData.isLoading);
      if (isServer) return;
      if (ctx.state.gameData.isLoading) {
        hasInitialized.value = true;
      }
    })

    logger(DebugTypeEnum.RENDER, LogLevel.ONE, "RENDER game.tsx");

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
          class={`flex flex-col flex-grow gap-1 justify-between w-full h-full p-[${
            GAME.CONTAINER_PADDING_PERCENT
          }%] ${ctx.state.userSettings.board.isLocked ? "overflow-auto" : ""}`}
          ref={ctx.containerRef}
        >
          <GameHeader />
          <Board />
        </div>

        <Loading isShowing={ctx.state.gameData.isLoading} />

        {/*
        <Settings />
        <EndGame />
*/}

        {hasInitialized.value && 
          <Settings />
        }
        {hasInitialized.value && 
          <EndGame />
        }
      </>
    );
  },
);
