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

import { formattedDeck } from "~/v3/utils/cards";
import deckUtils from "~/v3/utils/deckUtils";
import {
  calculateBoardDimensions,
  calculateLayouts,
} from "~/v3/utils/boardUtils";

import { useTimer } from "~/v3/utils/useTimer";
import {
  useDelayedTimeout,
  useInterval,
  useTimeout,
} from "~/v3/utils/useTimeout";

import FaceCardSymbols from "../../../playing-card-components/symbols/face-card-symbols";
import CardSymbols from "../../../playing-card-components/symbols/card-symbols";
import EndGame from "../end-game/end-game";
import GameHeader from "../../organisms/game-header/game-header";
import Settings from "../settings/settings";
import Loading from "../loading/loading";
import Board from "../../organisms/board/board";

import type { GameData, iGameSettings, iGameContext } from "~/v3/types/types";
import { GAME } from "~/v3/constants/game";
import { BOARD } from "~/v3/constants/board";
// import InverseModal from "../inverse-modal/inverse-modal";

const INITIAL_GAME_STATE: GameData = {
  isStarted: false,
  cards: [],
  mismatchPair: "",
  isShaking: false,
  flippedCardId: -1,
  selectedCardIds: [],
  successfulPairs: [],
  mismatchPairs: [],
  isLoading: true,
  shufflingState: 0,
};

const INITIAL_STATE = {
  boardLayout: {
    width: 291.07,
    height: 281.81,
    area: 291.07 * 281.81,
    columns: 5,
    rows: 4,
    isLocked: false, // prevent recalculation of board layout
    colWidth: 291.07 / 5,
    rowHeight: 281.81 / 4,
  },

  cardLayout: {
    width: 50.668,
    height: 70.3955,
    roundedCornersPx: 2.533,
    area: 50.668 * 70.3955,
    colGapPercent: 0,
    rowGapPercent: 0,
  },
  game: { ...INITIAL_GAME_STATE },

  settings: {
    cardFlipAnimationDuration: 800,

    /* ===================
     * NOT IMPLEMENTED
     * =================== */
    maxAllowableMismatches: -1,

    /* shuffle board after x mismatches
     *  0 = off
     *  1+ = every n mismatches
     * */
    shuffleBoardAfterMismatches: 0,
    /* shuffle board after successful pair */
    shuffleBoardAfterPair: false,
    /* shuffle board after success OR mismatch */
    shuffleBoardAfterRound: false,

    /* shuffle picked cards after placed back down after mismatch */
    shufflePickedAfterMismatch: false,

    /* recalculate board dimensions (eliminate empty spaces) on pair, on mismatch
     * */
    reorgnanizeBoardOnPair: false,
    reorgnanizeBoardOnMismatch: false,
    /* ===================
     * end NOT IMPLEMENTED
     * =================== */

    resizeBoard: false,

    deck: {
      size: GAME.DEFAULT_CARD_COUNT,
      isLocked: false,
      MINIMUM_CARDS: 6,
      MAXIMUM_CARDS: 52,
      fullDeck: formattedDeck,
    },

    interface: {
      showSelectedIds: false,
      showDimensions: false,
    },
  },
  interface: {
    successAnimation: false,
    mismatchAnimation: false,
    inverseSettingsModal: {
      isShowing: false,
    },
    settingsModal: {
      isShowing: false,
    },
    endOfGameModal: {
      isShowing: false,
      isWin: false,
    },
  },

  shuffleCardPositions: $(function (this: iGameContext) {
    // shuffle and set new positions, save old positions
    const newCards = deckUtils.shuffleCardPositions(this.game.cards);
    // console.log("shuffleCardPositions:", { newCards });
    this.game.cards = newCards;
  }),

  startShuffling: $(function (
    this: iGameContext,
    count: number = GAME.CARD_SHUFFLE_ROUNDS
  ) {
    this.shuffleCardPositions();
    this.game.shufflingState = count - 1;
    this.game.isLoading = true;
    this.interface.settingsModal.isShowing = false;
  }),

  stopShuffling: $(function (this: iGameContext) {
    this.game.shufflingState = 0;
    this.game.isLoading = false;
  }),

  sliceDeck: $(function (this: iGameContext) {
    const deckShuffledByPairs = deckUtils.shuffleDeckAndRefreshIds([
      ...this.settings.deck.fullDeck,
    ]);
    const cards = deckShuffledByPairs.slice(0, this.settings.deck.size);
    this.game.cards = cards;
  }),
  initializeDeck: $(async function (this: iGameContext) {
    await this.sliceDeck();
    this.startShuffling();
  }),

  calculateAndResizeBoard: $(function (
    this: iGameContext,
    boardRef: HTMLDivElement,
    containerRef: HTMLDivElement
  ) {
    const newBoard = calculateBoardDimensions(containerRef, boardRef);
    const { cardLayout, boardLayout } = calculateLayouts(
      newBoard.width,
      newBoard.height,
      this.settings.deck.size
    );
    this.cardLayout = cardLayout;
    this.boardLayout = {
      ...this.boardLayout,
      ...boardLayout,
    };
  }),

  showSettings: $(function (this: iGameContext) {
    this.timer.pause();
    this.interface.settingsModal.isShowing = true;
  }),
  hideSettings: $(function (this: iGameContext) {
    this.interface.settingsModal.isShowing = false;
    this.timer.resume();
  }),

  isGameEnded: $(function (this: iGameContext) {
    // TODO:
    // implement other modes, like max mismatches
    const isEnded =
      this.game.successfulPairs.length === this.settings.deck.size / 2;

    if (!isEnded) return { isEnded };

    const isWin =
      this.game.successfulPairs.length === this.settings.deck.size / 2;

    return { isEnded, isWin };
  }),

  startGame: $(function (this: iGameContext) {
    if (this.timer.state.isStarted) {
      this.timer.reset();
    }
    this.timer.start();
  }),
  endGame: $(function (this: iGameContext, isWin: boolean) {
    this.timer.stop();
    this.interface.endOfGameModal.isWin = isWin;
    this.interface.endOfGameModal.isShowing = true;
  }),

  resetGame: $(async function (
    this: iGameContext,
    settings?: Partial<iGameSettings>
  ) {
    if (settings !== undefined) {
      this.settings = {
        ...this.settings,
        ...settings,
      };
    }

    // this.game = INITIAL_GAME_STATE;
    this.game.isStarted = INITIAL_GAME_STATE.isStarted;
    this.game.isLoading = INITIAL_GAME_STATE.isLoading;
    this.game.isShaking = INITIAL_GAME_STATE.isShaking;
    this.game.shufflingState = INITIAL_GAME_STATE.shufflingState;
    this.game.flippedCardId = INITIAL_GAME_STATE.flippedCardId;
    this.game.mismatchPair = INITIAL_GAME_STATE.mismatchPair;

    // this.game.cards = [...INITIAL_GAME_STATE.cards];
    // this.game.mismatchPairs = [...INITIAL_GAME_STATE.mismatchPairs];
    // this.game.successfulPairs = [...INITIAL_GAME_STATE.successfulPairs];
    // this.game.selectedCardIds = [...INITIAL_GAME_STATE.selectedCardIds];

    this.game.cards = INITIAL_GAME_STATE.cards;
    this.game.mismatchPairs = INITIAL_GAME_STATE.mismatchPairs;
    this.game.successfulPairs = INITIAL_GAME_STATE.successfulPairs;
    this.game.selectedCardIds = INITIAL_GAME_STATE.selectedCardIds;

    await this.timer.reset();
    await this.initializeDeck();
    // console.log("game reset");
  }),
};

export default component$(() => {
  const timer = useTimer();
  const gameContext = useStore<iGameContext>(
    {
      ...INITIAL_STATE,
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
  useInterval(
    $(() => {
      gameContext.shuffleCardPositions();
    }),
    useComputed$(
      () =>
        !gameContext.timer.state.isStarted && !gameContext.timer.state.isEnded
    ),
    GAME.AUTO_SHUFFLE_INTERVAL,
    GAME.AUTO_SHUFFLE_DELAY
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
    BOARD.CARD_SHUFFLE_PAUSE_DURATION + BOARD.CARD_SHUFFLE_ACTIVE_DURATION
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
    GAME.SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD,
    GAME.SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD +
      BOARD.CARD_SHAKE_ANIMATION_DURATION
  );

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
        }%] gap-1 ${gameContext.boardLayout.isLocked ? "overflow-x-auto" : ""}`}
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
});
