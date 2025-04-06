import { $, component$, useComputed$, useOnDocument } from "@builder.io/qwik";

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

import GAME from "~/v3/constants/game";
import BOARD from "~/v3/constants/board";
import { useVisibilityChange } from "~/v3/hooks/useVisibilityChange/useVisibilityChange";
import { useGameContextProvider } from "~/v3/services/gameContext.service/gameContext.service";
import INITIAL_STATE from "~/v3/services/gameContext.service/initialState";
import type { iUserSettings } from "~/v3/types/types";
import { header } from "~/v3/constants/header-constants";
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
     * TODO:
     * create another helper which runs an interval for x rounds?
     *  - perhaps also with an additional wait time at the end
     *    - instead of having it go negative
     *  - can then run a handler at the end of the whole process
     * TODO: fix a bug:
     *  - change the deck size to say 52 from 6
     *  - the cards start fanning before the game board recalculates!!!
     *  - so it deals out one card or two and then resets and deals out
     *    the 52 actual cards that it should be dealing
     *    - need a way to track if it's ready to deal,
     *      e.g. set a new loading state if deck size is changed,
     *        and then reset after board has recalculated?
     *    - or ensure the order is correct
     *
     *  - e.g. this track below will track the deckSize, and then I see a log of
     *  the center coords as still the old coords,
     *  and then the board updates and I see a log of the new coords,
     *    but it must've started dealing inbetween and then reset
     *  - will test with center/center coords as well, I think the bug is still there
     *  but I never checked when I first made this feature
     *
     *  So:
     *  when initializing deck aka resetting aka when game first loads,
     *  should recalculate board layout (because deckSize mightve changed)
     *
     * */
    // const { delaySignal } =
    useTimeoutObj({
      triggerCondition: useComputed$(
        () =>
          ctx.state.gameData.currentFanOutCardIndex >
          -(ctx.state.gameData.fanOutCardDelayRounds - 1),
      ),
      // ms in between cards being fanned out
      // slightly faster for larger decks
      // delay: 250 - ctx.state.userSettings.deck.size * 4,
      delay: useComputed$(
        () => (1 + GAME.DECK_SIZE_MAX - ctx.state.userSettings.deck.size) * 6,
      ),
      action: ctx.handle.fanOutCard,
    });

    // updates the fan-out delay based on deck size
    // useTask$(({ track }) => {
    //   const deckSize = track(() => ctx.state.userSettings.deck.size);
    //   console.log("tracked deckSize:", deckSize);
    //   delaySignal.value = (1 + GAME.DECK_SIZE_MAX - deckSize) * 6;
    // });

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
      initialDelay: GAME.AUTO_SHUFFLE_DELAY,
      interval: GAME.AUTO_SHUFFLE_INTERVAL,
      action: ctx.handle.shuffleCardPositions,
    });

    /* ================================
     * Handles shuffling rounds
     * - when shuffling state > 0, we shuffle a round and then decrement
     * ================================ */
    useTimeoutObj({
      triggerCondition: useComputed$(
        () => ctx.state.gameData.shufflingState > 0,
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
        // if (
        //   ctx.state.gameData.flippedCardId !==
        //   INITIAL_STATE.gameData.flippedCardId
        // )
        //   return;
        // if (ctx.state.gameData.isLoading) return;

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
          class={`flex flex-col flex-grow justify-between w-full h-full p-[${
            GAME.CONTAINER_PADDING_PERCENT
          }%] gap-1 ${
            ctx.state.userSettings.board.isLocked ? "overflow-x-auto" : ""
          }`}
          ref={ctx.containerRef}
        >
          <GameHeader showSettings$={ctx.handle.showSettings} />
          <Board />
        </div>

        <Loading isShowing={ctx.state.gameData.isLoading} />
        <Settings />
        <EndGame />
      </>
    );
  },
);
