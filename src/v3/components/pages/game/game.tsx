import {
  $,
  component$,
  useComputed$,
  useContextProvider,
  useSignal,
  useStore,
} from "@builder.io/qwik";
import { GameContext } from "~/v3/context/gameContext";

import { useTimer } from "~/v3/hooks/useTimer";
import {
  useDelayedTimeoutObj,
  useIntervalObj,
  useTimeoutObj,
} from "~/v3/hooks/useTimeout";

import FaceCardSymbols from "~/v3/components/playing-card-components/symbols/face-card-symbols";
import CardSymbols from "~/v3/components/playing-card-components/symbols/card-symbols";
import EndGame from "~/v3/components/pages/end-game/end-game";
import GameHeader from "~/v3/components/organisms/game-header/game-header";
import Settings from "~/v3/components/pages/settings/settings";
import Loading from "~/v3/components/pages/loading/loading";
import Board from "~/v3/components/organisms/board/board";

import { GAME } from "~/v3/constants/game";
import { BOARD } from "~/v3/constants/board";
import {
  INITIAL_STATE,
  INITIAL_USER_SETTINGS,
} from "~/v3/context/initialState";
import { useVisibilityChange } from "~/v3/hooks/useVisibilityChange/useVisibilityChange";
import type { iUserSettings, iGameContext } from "~/v3/types/types";
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
// export const keysSettings = getKeysIfObject(INITIAL_USER_SETTINGS);

export default component$(
  ({ settings = INITIAL_USER_SETTINGS }: { settings: iUserSettings }) => {
    // console.log("game component settings:", { settings });
    const timer = useTimer();
    const gameContext = useStore<iGameContext>(
      {
        ...INITIAL_STATE,
        userSettings: {
          ...settings,
        },
        timer: timer,
      },
      { deep: true }
    );
    useContextProvider(GameContext, gameContext);
    const containerRef = useSignal<HTMLDivElement>();

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
        gameContext.shuffleCardPositions();
      }),
      triggerCondition: useComputed$(
        () =>
          !gameContext.timer.state.isStarted && !gameContext.timer.state.isEnded
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
        gameContext.shuffleCardPositions();
        gameContext.game.shufflingState -= 1;

        if (gameContext.game.shufflingState <= 0) gameContext.stopShuffling();
      }),
      triggerCondition: useComputed$(() => gameContext.game.shufflingState > 0),
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
        gameContext.game.isShaking = true;
      }),
      actionOnEnd: $(() => {
        gameContext.game.isShaking = false;
        gameContext.game.mismatchPair = "";
      }),
      triggerCondition: useComputed$(
        () => gameContext.game.mismatchPair !== ""
      ),
      initialDelay:
        GAME.SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD,
      interval:
        GAME.SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD +
        BOARD.CARD_SHAKE_ANIMATION_DURATION,
    });

    useVisibilityChange({
      onHidden$: $(() => {
        gameContext.showSettings();
      }),
    });

    return (
      <>
        {/* SVG card symbols */}
        <CardSymbols />
        <FaceCardSymbols />

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
            gameContext.userSettings.board.isLocked ? "overflow-x-auto" : ""
          }`}
          ref={containerRef}
        >
          <GameHeader
            showSettings$={() => {
              gameContext.showSettings();
            }}
          />
          <Board containerRef={containerRef} />
        </div>

        <Loading isShowing={gameContext.game.isLoading} />
        <Settings />
        <EndGame />
      </>
    );
  }
);
