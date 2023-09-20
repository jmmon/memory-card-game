import {
  $,
  component$,
  useComputed$,
  useContext,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import { GameContext } from "../../context/gameContext";
import SettingsModal from "../settings-modal/settings-modal";
import GameHeader from "../game-header/game-header";
import GameEndModal from "../game-end-modal/game-end-modal";
import {
  useDelayedTimeout,
  useInterval,
  useTimeout,
} from "~/v3/utils/useTimeout";
import FaceCardSymbols from "../playing-card-components/face-card-symbols";
import CardSymbols from "../playing-card-components/card-symbols";
import ScoresModal from "../scores-modal/scores-modal";
import Board from "../board/board";
import CONSTANTS from "~/v3/utils/constants";
import InverseModal from "../inverse-modal/inverse-modal";
import GameSettings from "../settings-modal/game-settings";
import { iGameSettings } from "~/v3/types/types";

export default component$(() => {
  const gameContext = useContext(GameContext);
  const containerRef = useSignal<HTMLElement>();

  /* ================================
   * Shuffle on interval (for fun)
   * - gives it a nice look if you leave the tab open (and you haven't started the game)
   * ================================ */
  useInterval(
    $(() => {
      gameContext.shuffleCardPositions();
    }),
    useComputed$(
      () =>
        !gameContext.timer.state.isStarted && !gameContext.timer.state.isEnded
    ),
    CONSTANTS.GAME.AUTO.SHUFFLE_INTERVAL,
    CONSTANTS.GAME.AUTO.SHUFFLE_DELAY
  );

  /* ================================
   * Handles shuffling
   * - when shuffling state > 0, we shuffle a round and then decrement
   * ================================ */
  useTimeout(
    $(() => {
      gameContext.shuffleCardPositions();
      gameContext.game.shufflingState -= 1;

      if (gameContext.game.shufflingState <= 0) gameContext.stopShuffling();
    }),
    useComputed$(() => gameContext.game.shufflingState > 0),
    CONSTANTS.CARD.ANIMATIONS.SHUFFLE_PAUSE +
    CONSTANTS.CARD.ANIMATIONS.SHUFFLE_ACTIVE
  );

  /* ================================
   * Handle Shake Animation Timers
   * - when mismatching a pair, shake the cards
   *   - wait until card is returned before starting
   * ================================ */
  useDelayedTimeout(
    $(() => {
      gameContext.game.isShaking = true;
    }),
    $(() => {
      gameContext.game.isShaking = false;
      gameContext.game.mismatchPair = "";
    }),
    useComputed$(() => gameContext.game.mismatchPair !== ""),
    CONSTANTS.CARD.ANIMATIONS.SHAKE_DELAY_AFTER_STARTING_RETURN,
    CONSTANTS.CARD.ANIMATIONS.SHAKE_DELAY_AFTER_STARTING_RETURN +
    CONSTANTS.CARD.ANIMATIONS.SHAKE
  );

  /* ============================
   * pause game when switching tabs
   * - set up listeners
   * ============================ */
  useVisibleTask$(({ cleanup }) => {
    console.log("setup visibilitychange listener");
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
      (document as Document & { onfocusin: any; onfocusout: any }).onfocusin = (
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
      console.log("onchange runs", { evt });
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
    if ((document as Document & { [key: string]: any })[hidden] !== undefined) {
      onchange({
        type: (document as Document & { [key: string]: any })[hidden]
          ? "blur"
          : "focus",
      });
    }

    cleanup(() => {
      console.log("cleanup visibilitychange listener");
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

  const newSettings = useSignal<iGameSettings>({
    ...gameContext.settings,
  });
  return (
    <>
      {/* SVG card symbols */}
      <CardSymbols />
      <FaceCardSymbols />

      <InverseModal
        isShowing={gameContext.interface.settingsModal.isShowing}
        hideModal$={() => {
          newSettings.value = gameContext.settings;
          gameContext.hideSettings();
        }}
        title="Settings"
        direction="left"
settingsClasses="bg-slate-700"
      >
        <div
          q: slot="mainContent"
          class={`flex flex-col flex-grow justify-between w-full h-full p-[${CONSTANTS.GAME.BOARD_PADDING_PERCENT
            }%] gap-1 ${gameContext.boardLayout.isLocked ? "overflow-x-auto" : ""
            }`}
          style={{
            background: `var(--qwik-dark-background)`,
            color: `var(--qwik-dark-text)`,
          }}
          ref={containerRef}
        >
          <GameHeader
            showSettings$={() => {
              gameContext.showSettings();
            }}
          />

          <Board containerRef={containerRef} />
        </div>
        <div
          class="flex justify-center w-full h-full"
          style={{
            background: `var(--qwik-dark-background)`,
            color: `var(--qwik-dark-text)`,
          }}
          q: slot="revealedContent"
        >
          <GameSettings settings={newSettings}
            q: slot="revealedContent"
          />
        </div>
      </InverseModal>
      {/* 

      <div
        class={`flex flex-col flex-grow justify-between w-full h-full p-[${CONSTANTS.GAME.BOARD_PADDING_PERCENT}%] gap-1 ${
          gameContext.boardLayout.isLocked ? "overflow-x-auto" : ""
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
*/}

      <LoadingPage isShowing={gameContext.game.isLoading} />
      {/* <SettingsModal /> */}
      <GameEndModal />
      <ScoresModal />
    </>
  );
});

const LoadingPage = component$(
  ({ isShowing, blur = true }: { isShowing: boolean; blur?: boolean }) => (
    <>
      <div
        class={`${isShowing
            ? `${blur ? "backdrop-blur-[2px]" : ""
            } opacity-100 z-50 pointer-events-auto`
            : "z-[-1] pointer-events-none opacity-0"
          } text-slate-200 transition-all bg-black bg-opacity-20 absolute top-0 left-0 text-4xl w-full flex-grow h-full flex justify-center items-center `}
      >
        Loading...
      </div>
    </>
  )
);

/*
 *
 * TODO:
 *
 *
 * Query params to initialize game with certain settings? would be epic!
 *
 *
 *
 *
 *
 *
 * db: storing game data
 * - want initials of user? or actual login info??? meh
 *   - maybe there's a way to make a unique identifier for the ip / user / session / ??? otherwise might have lots of dupliate initials.
 * - want to store pairs, mismatches, deck.size, time.total, modes? (TODO)
 * - then can fetch all data and sort by deck.size
 *   - and then can compare current game with the rest (of the same deck.size) to find out how good you did vs others (percentile)
 *
 *
 *
 *
 *
 *  Saving scores:
 *  end of game modal:
 *  have 2 inputs: initials and score
 *  - autofilled with random hash/chars
 *  - could have icon generated by combo of email hash (layout) and initials (color)
 *
 * take Initials string, 3 chars, the main input
 * take "identifier" string, defaults to a random hash/string
 *  - this is a secondary input, much smaller and with explanation
 *  after done typing (debounced input), calculate the new icon & color
 *
 *  So you win the game, and the score save modal pops up with 2 input boxes, along with your scores (and it should pre-fetch all the scores so it will calculate and display your percentile before you save)
 *  By default, we generate a random hash for the identifier string, and maybe start with AAA for initials??
 *  We then hash that identifier string (whatever is in there) (and the initials?) and use that hash to generate the icon and color, so if they change the string or initials we will recalculate the hash for the icon/color
 *  Then they hit save, and we save the hashed result (which generated the color) along with the initials, and the scores.
 *
 * After saving, we can show a scoreboard, maybe showing +- 5 scores around where the player landed, and maybe also the top 3 scores.
 *
 * Can ask the user if we can save their initials and string into localStorage to be used as the default for future games on this device
 *
 *
 *
 *
 * Timer bug:
 * perhaps it saves the "start time", and then the user locks phone and stops playing for a time
 * then when resuming, maybe the stop time is taken now, causing a weird calculation??
 * - just run the effect to count the time, and don't mess with timestamps!
 *
 *
 *
 *
 * Reset Game button does NOT reset the scores!! It does however reset the timer
 *
 *
 *
 * scores:
 * TODO:
 * - implement paging: show x scores instead of showing all scores
 * - implement tabulation: tabs based on deckSize, and first tab is All sizes
 *   - When winning a game, want to open the scores modal while selecting
 *     specific deckSize of the finished game
 * */

/*
 *
 *  TODO: attempt to find edge case in qwik build? heh...
 *
 *  board component fetches and initializes cards, then jsx is able to render them
 *  board component is using a variable exported by card component
 *  the order of imports in the build ends up out of order for some reason
 *
 *  */
