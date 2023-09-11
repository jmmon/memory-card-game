import {
  $,
  component$,
  useComputed$,
  useContextProvider,
  useSignal,
  useStore,
  useVisibleTask$,
} from "@builder.io/qwik";
import V3Board, {
  CARD_FLIP_ANIMATION_DURATION,
  CARD_SHAKE_ANIMATION_DURATION,
  CARD_SHUFFLE_ACTIVE_DURATION,
  CARD_SHUFFLE_PAUSE_DURATION,
} from "../board/board";
import { GameContext } from "../../context/gameContext";
import SettingsModal from "../settings-modal/settings-modal";
import GameHeader from "../game-header/game-header";
import GameEndModal from "../game-end-modal/game-end-modal";
import type {
  GameData,
  GameSettings,
  GameContext as TGameContext,
} from "~/v3/types/types";
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
import FaceCardSymbols from "../playing-card-components/face-card-symbols";
import CardSymbols from "../playing-card-components/card-symbols";
import serverDbService from "~/v3/services/db.service";
import ScoresModal from "../scores-modal/scores-modal";
// import dbService from "../services/db.service";
// import InverseModal from "../inverse-modal/inverse-modal";

const AUTO_SHUFFLE_INTERVAL = 10000;
const AUTO_SHUFFLE_DELAY = 10000;

export const CARD_SHUFFLE_ROUNDS = 5;

// higher means shake starts sooner
const START_SHAKE_ANIMATION_EAGER_MS = 250;
const START_SHAKE_WHEN_FLIP_DOWN_IS_PERCENT_COMPLETE = 0.75;
const SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD =
  CARD_FLIP_ANIMATION_DURATION *
    START_SHAKE_WHEN_FLIP_DOWN_IS_PERCENT_COMPLETE -
  START_SHAKE_ANIMATION_EAGER_MS;

export const DEFAULT_CARD_COUNT = 18;

export const CONTAINER_PADDING_PERCENT = 1.5;

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
  game: INITIAL_GAME_STATE,

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
      size: DEFAULT_CARD_COUNT,
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
    scoresModal: {
      isShowing: false,
      scores: [],
    },
  },

  shuffleCardPositions: $(function (this: TGameContext) {
    // shuffle and set new positions, save old positions
    const newCards = deckUtils.shuffleCardPositions(this.game.cards);
    console.log("shuffleCardPositions:", { newCards });
    this.game.cards = newCards;
  }),

  startShuffling: $(function (
    this: TGameContext,
    count: number = CARD_SHUFFLE_ROUNDS
  ) {
    this.shuffleCardPositions();
    this.game.shufflingState = count - 1;
    this.game.isLoading = true;
    this.interface.settingsModal.isShowing = false;
  }),

  stopShuffling: $(function (this: TGameContext) {
    this.game.shufflingState = 0;
    this.game.isLoading = false;
  }),

  sliceDeck: $(function (this: TGameContext) {
    const deckShuffledByPairs = deckUtils.sliceRandomPairsFromDeck([
      ...this.settings.deck.fullDeck,
    ]);
    const cards = deckShuffledByPairs.slice(0, this.settings.deck.size);
    this.game.cards = cards;
  }),
  initializeDeck: $(async function (this: TGameContext) {
    await this.sliceDeck();
    this.startShuffling();
  }),

  calculateAndResizeBoard: $(function (
    this: TGameContext,
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

  showSettings: $(function (this: TGameContext) {
    this.timer.pause();
    this.interface.settingsModal.isShowing = true;
  }),
  hideSettings: $(function (this: TGameContext) {
    this.interface.settingsModal.isShowing = false;
    this.timer.resume();
  }),

  isGameEnded: $(function (this: TGameContext) {
    // TODO:
    // implement other modes, like max mismatches
    const isEnded =
      this.game.successfulPairs.length === this.settings.deck.size / 2;
    console.log({ isEnded });

    if (!isEnded) return { isEnded };

    const isWin =
      this.game.successfulPairs.length === this.settings.deck.size / 2;

    console.log({ isEnded, isWin });
    return { isEnded, isWin };
  }),

  startGame: $(async function (this: TGameContext) {
    if (this.timer.state.isStarted) {
      this.timer.reset();
    }
    this.timer.start();

    console.log("getting all scores...");
    const scores = await serverDbService.getAllScores();
    console.log({ scores });
  }),
  endGame: $(async function (this: TGameContext, isWin: boolean) {
    this.timer.stop();
    this.interface.endOfGameModal.isWin = isWin;
    this.interface.endOfGameModal.isShowing = true;

    // TODO: run this as a completion modal
    // allow user to input their initials
    // allow them to input email  (not saved to db, but hashed for UUID)
    // combine both email + username to create UUID? or have two separate identifiers?
    // might be cool if use the same email but different initials and the color matches
    // dbService.createScore({
    //   deckSize: this.settings.deck.size,
    //   gameTime: `${this.timer.state.runningTime} millisecond`,
    //   mismatches: this.game.mismatchPairs.length,
    //   userId: (Math.random() * 1000000).toFixed(0),
    //   initials: "joe",
    // });

    this.fetchScores();
  }),

  resetGame: $(async function (
    this: TGameContext,
    settings?: Partial<GameSettings>
  ) {
    if (settings) {
      this.settings = {
        ...this.settings,
        ...settings,
      };
    }
    this.game = INITIAL_GAME_STATE;
    await this.timer.reset();
    this.initializeDeck();
  }),

fetchScores: $(async function (this: TGameContext) {
    console.log("getting all scores...");
  const scores = await serverDbService.getAllScores();
  this.interface.scoresModal.scores = scores
    console.log({ scores });
})
};

export default component$(() => {
  const timer = useTimer();
  console.log("game render");
  const gameContext = useStore<TGameContext>(
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
    AUTO_SHUFFLE_INTERVAL,
    AUTO_SHUFFLE_DELAY
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
    CARD_SHUFFLE_PAUSE_DURATION + CARD_SHUFFLE_ACTIVE_DURATION
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
    SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD,
    SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD +
      CARD_SHAKE_ANIMATION_DURATION
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
        class={`flex flex-col flex-grow justify-between w-full h-full p-[${CONTAINER_PADDING_PERCENT}%] gap-1 ${
          gameContext.boardLayout.isLocked ? "overflow-x-auto" : ""
        }`}
        ref={containerRef}
      >
        <GameHeader
          showSettings$={() => {
            gameContext.showSettings();
          }}
        />
        <V3Board containerRef={containerRef} />
      </div>

      <LoadingPage isShowing={gameContext.game.isLoading} />
      <SettingsModal />
      <GameEndModal />
      <ScoresModal />
    </>
  );
});

const LoadingPage = component$(
  ({ isShowing, blur = true }: { isShowing: boolean; blur?: boolean }) => (
    <>
      <div
        class={`${
          isShowing
            ? `${
                blur ? "backdrop-blur-[2px]" : ""
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
 * maybe use sql?
 * scoreModel: {
 *   createdAt: Date,
 *   time: number,
 *   deckSize: number,
 *   mismatches: number,
 *   userId: string (256 chars?? this is the hashed result of the "email/identifier" input box)
 *   initials: string (3 chars)
 * }
 *
 * submitWin(data): submits the win and calculates and returns your percentile scores
 *
 * getCategory(deckSize): returns list of scores matching deck size
 * getAllScores(): returns all scores
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
 *
 *
 *
 *
 * Reset Game button does NOT reset the scores!! It does however reset the timer
 *
 *
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
