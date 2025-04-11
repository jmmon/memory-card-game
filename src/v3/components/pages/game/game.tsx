import { $, component$, useComputed$, useOnDocument } from "@builder.io/qwik";

import {
  useDelayedTimeoutObj,
  useIntervalObj,
  useTimeoutObj,
} from "~/v3/hooks/useTimeout";

// import EndGame from "~/v3/components/pages/end-game/end-game";
import GameHeader from "~/v3/components/organisms/game-header/game-header";
import Settings from "~/v3/components/pages/settings/settings";
import Loading from "~/v3/components/pages/loading/loading";
import Board from "~/v3/components/organisms/board/board";

import GAME from "~/v3/constants/game";
import BOARD from "~/v3/constants/board";
import { useVisibilityChange } from "~/v3/hooks/useVisibilityChange/useVisibilityChange";
import { useGameContextProvider } from "~/v3/services/gameContext.service/gameContext.service";
import INITIAL_STATE from "~/v3/services/gameContext.service/initialState";
import type { iUserSettings } from "~/v3/types/types";
import { header } from "~/v3/constants/header-constants";
import GameEndModal from "../../game-end-modal/game-end-modal";
import ScoresModal from "../../scores-modal/scores-modal";
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

type GameProps = { settings: iUserSettings };
export default component$<GameProps>(
  ({ settings = INITIAL_STATE.userSettings }) => {
    // console.log("game component settings:", { settings });
    const ctx = useGameContextProvider({
      userSettings: settings,
    });

    /**
     * runs the fan out card animation, timeout per each round
     *
     * TODO:
     * create another helper which runs an interval for n occurrences?
     * instead of a bunch of timeouts created and destroyed over and over
     *  - perhaps also with an additional wait time at the end
     *    - instead of having it go negative
     *  - can then run a handler at the end of the whole process
     *
     * */
    useTimeoutObj({
      triggerCondition: useComputed$(
        () =>
          ctx.state.gameData.currentFanOutCardIndex >
          -(ctx.state.gameData.fanOutCardDelayRounds - 1),
      ),
      // want to keep it reasonable across all deck sizes
      // so now it takes a base of ~1.5s divided by the cards,
      // and adds a small additional flat value
      // so 52 cards will take longer, but it still starts at the same base value
      // e.g. 1500 base across the cards, + 35ms per card
      //  - e.g. 6 cards == 1500 + 210 => 1710ms / 6 = 285ms per card
      //  - e.g. 18 cards == 1500 + 35*18 = 1500 + 1330 => 1830ms / 18 = ~102ms per card
      //  - e.g. 32 cards == 1500 + 35*32 = 1500 + 70 + 1050 => 2620ms / 32 = ~82ms per card
      //  - e.g. 52 cards == 1500 + 35*52 = 1500 + 1400 + 420 => 3320ms == ~64ms per card
      delay: useComputed$(
        () =>
          GAME.FAN_OUT_DURATION_BASE_MS / ctx.state.userSettings.deck.size +
          GAME.FAN_OUT_DURATION_ADDITIONAL_PER_CARD_MS,
      ),
      action: ctx.handle.fanOutCard,
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
      triggerCondition: useComputed$(
        () =>
          // delay until after fan-out phase
          ctx.state.gameData.currentFanOutCardIndex ===
            -(ctx.state.gameData.fanOutCardDelayRounds - 1) &&
          !ctx.timer.state.isStarted &&
          !ctx.timer.state.isEnded,
      ),
      initialDelay:
        GAME.AUTO_SHUFFLE_DELAY +
        BOARD.CARD_SHUFFLE_ACTIVE_DURATION +
        BOARD.CARD_SHUFFLE_PAUSE_DURATION,
      interval: GAME.AUTO_SHUFFLE_INTERVAL,
      action: ctx.handle.shuffleCardPositions,
    });

    /* ================================
     * Handles shuffling rounds
     * - when shuffling state > 0, we shuffle a round and then decrement
     * ================================ */
    useTimeoutObj({
      triggerCondition: useComputed$(
        () =>
          ctx.state.gameData.currentFanOutCardIndex ===
            -(ctx.state.gameData.fanOutCardDelayRounds - 1) &&
          ctx.state.gameData.shufflingState > 0,
      ),
      delay:
        BOARD.CARD_SHUFFLE_PAUSE_DURATION + BOARD.CARD_SHUFFLE_ACTIVE_DURATION,
      action: $(() => {
        ctx.handle.shuffleCardPositions();
        ctx.state.gameData.shufflingState--;

        if (ctx.state.gameData.shufflingState <= 0) ctx.handle.stopShuffling();
      }),
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

    // when switching tabs, show settings to pause the game
    useVisibilityChange({
      onHidden$: ctx.handle.showSettings,
    });

    useOnDocument(
      "keydown",
      $((event: KeyboardEvent) => {
        if (event.key !== "Escape") return;

        ctx.handle.toggleModalOnEscape();
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
          class={`flex flex-col flex-grow gap-1 justify-between w-full h-full p-[${
            GAME.CONTAINER_PADDING_PERCENT
          }%] ${ctx.state.userSettings.board.isLocked ? "overflow-auto" : ""}`}
          ref={ctx.containerRef}
        >
          <GameHeader showSettings$={ctx.handle.showSettings} />
          <Board />
        </div>

        <Loading isShowing={ctx.state.gameData.isLoading} />
        <Settings />
        <GameEndModal />
        <ScoresModal />
        {/*
        <EndGame />
*/}
      </>
    );
  },
);
