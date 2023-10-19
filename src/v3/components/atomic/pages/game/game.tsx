import {
  $,
  component$,
  useComputed$,
  useContextProvider,
  useSignal,
  useStore,
  useVisibleTask$,
} from "@builder.io/qwik";
import { GameContext } from "../../../../context/gameContext";

import { useTimer } from "~/v3/utils/useTimer";
import {
  useDelayedTimeoutObj,
  useIntervalObj,
  useTimeoutObj,
} from "~/v3/utils/useTimeout";

import FaceCardSymbols from "../../../playing-card-components/symbols/face-card-symbols";
import CardSymbols from "../../../playing-card-components/symbols/card-symbols";
import EndGame from "../end-game/end-game";
import GameHeader from "../../organisms/game-header/game-header";
import Settings from "../settings/settings";
import Loading from "../loading/loading";
import Board from "../../organisms/board/board";

import type { iUserSettings, iGameContext } from "~/v3/types/types";
import { GAME } from "~/v3/constants/game";
import { BOARD } from "~/v3/constants/board";
import {
  INITIAL_STATE,
  INITIAL_USER_SETTINGS,
} from "~/v3/context/initialState";
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
    const containerRef = useSignal<HTMLElement>();

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

    /* ============================
     * pause game when switching tabs
     * - set up listeners
     * ============================ */
    useVisibleTask$(({ cleanup }) => {
      let hidden = "hidden";
      let state = 0;

      // Standards:
      if (hidden in document) {
        document.addEventListener("visibilitychange", onchange);
        state = 1;
      } else if ((hidden = "mozHidden") in document) {
        document.addEventListener("mozvisibilitychange", onchange);
        state = 2;
      } else if ((hidden = "webkitHidden") in document) {
        document.addEventListener("webkitvisibilitychange", onchange);
        state = 3;
      } else if ((hidden = "msHidden") in document) {
        document.addEventListener("msvisibilitychange", onchange);
        state = 4;
      }
      // IE 9 and lower:
      else if ("onfocusin" in document) {
        (document as Document & { onfocusin: any; onfocusout: any }).onfocusin =
          (
            document as Document & { onfocusin: any; onfocusout: any }
          ).onfocusout = onchange;
        state = 5;
      }
      // All others:
      else {
        window.onpageshow =
          window.onpagehide =
          window.onfocus =
          window.onblur =
            onchange;
      }

      function onchange(evt: any) {
        const v = "visible",
          h = "hidden",
          evtMap: { [key: string]: string } = {
            focus: v,
            focusin: v,
            pageshow: v,
            blur: h,
            focusout: h,
            pagehide: h,
          };

        evt = evt || window.event;
        if (evt.type in evtMap) {
          document.body.dataset["visibilitychange"] = evtMap[evt.type];
        } else {
          // @ts-ignore
          document.body.dataset["visibilitychange"] = this[hidden]
            ? "hidden"
            : "visible";
        }

        if (document.body.dataset["visibilitychange"] === "hidden") {
          gameContext.showSettings();
        }
      }

      // set the initial state (but only if browser supports the Page Visibility API)
      if (
        (document as Document & { [key: string]: any })[hidden] !== undefined
      ) {
        onchange({
          type: (document as Document & { [key: string]: any })[hidden]
            ? "blur"
            : "focus",
        });
      }

      cleanup(() => {
        if (state === 1) {
          document.removeEventListener("visibilitychange", onchange);
        } else if (state === 2) {
          document.removeEventListener("mozvisibilitychange", onchange);
        } else if (state === 3) {
          document.removeEventListener("webkitvisibilitychange", onchange);
        } else if (state === 4) {
          document.removeEventListener("msvisibilitychange", onchange);
        } else if (state === 5) {
          (document as Document & { onfocusin: any }).onfocusin = (
            document as Document & { onfocusout: any }
          ).onfocusout = null;
        } else if (state === 0) {
          window.onpageshow =
            window.onpagehide =
            window.onfocus =
            window.onblur =
              null;
        }
      });
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
