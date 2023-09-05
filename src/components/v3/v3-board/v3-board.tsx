import type { QwikMouseEvent, Signal } from "@builder.io/qwik";
import {
  $,
  component$,
  useContext,
  useOnWindow,
  useSignal,
  useStyles$,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";

import V3Card from "../v3-card/v3-card";
import { AppContext } from "../v3-context/v3.context";
import type { Pair } from "../v3-game/v3-game";
import { CONTAINER_PADDING_PERCENT } from "../v3-game/v3-game";
import { useDebounce } from "../utils/useDebounce";
import { calculateLayouts } from "../utils/boardUtils";
import v3CardUtils from "../utils/v3CardUtils";

export const CARD_RATIO = 113 / 157; // w / h
export const CORNERS_WIDTH_RATIO = 1 / 20;

export const CARD_FLIP_ANIMATION_DURATION = 600;
export const CARD_SHAKE_ANIMATION_DURATION = 600;
// higher means shake starts sooner
const START_SHAKE_ANIMATION_EAGER_MS = 20;
const START_SHAKE_WHEN_FLIP_DOWN_IS_PERCENT_COMPLETE = 0.75;
const SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD =
  CARD_FLIP_ANIMATION_DURATION *
    START_SHAKE_WHEN_FLIP_DOWN_IS_PERCENT_COMPLETE -
  START_SHAKE_ANIMATION_EAGER_MS;

// after initial instant transform, wait this long before starting animation
export const CARD_SHUFFLE_PAUSE_DURATION = 50;
// animation duration
export const CARD_SHUFFLE_ACTIVE_DURATION = 350;
export const CARD_SHUFFLE_ROUNDS = 5;

const MINIMUM_CARD_VIEW_TIME = 500;
const MINIMUM_BETWEEN_CARDS = 500;

export default component$(
  ({ containerRef }: { containerRef: Signal<HTMLElement | undefined> }) => {
    const gameContext = useContext(AppContext);
    const boardRef = useSignal<HTMLDivElement>();

    const lastDeckSize = useSignal(gameContext.settings.deck.size);
    const lastRefresh = useSignal(gameContext.settings.resizeBoard);

    const flippedTime = useSignal(-1);
    const unflippedTime = useSignal(-1);
    const lastClick = useSignal(-1);

    const handleAddToSuccessfulPairsIfMatching = $(async () => {
      const [cardId1, cardId2] = gameContext.game.selectedCardIds;
      const pair: Pair = `${cardId1}:${cardId2}`;
      // run checkMatch
      const card1 = v3CardUtils.findCardById(gameContext.game.cards, cardId1);
      const card2 = v3CardUtils.findCardById(gameContext.game.cards, cardId2);
      const isMatch = v3CardUtils.checkMatch(card1, card2);

      // console.log({ isMatch, card1, card2 });

      if (!isMatch) {
        gameContext.game.mismatchPairs = [
          ...gameContext.game.mismatchPairs,
          pair,
        ];
        gameContext.game.mismatchPair = pair;
        gameContext.interface.mismatchAnimation = true;
      } else {
        // add to our pairs
        gameContext.game.successfulPairs = [
          ...gameContext.game.successfulPairs,
          pair,
        ];

        // TODO:
        // some success animation to indicate a pair,
        // like a sparkle or a background blur around the pairs count
        gameContext.interface.successAnimation = true;
      }

      // clear our selectedCards
      gameContext.game.selectedCardIds = [];

      // finally finally, check for end conditions
      const res = await gameContext.isGameEnded();

      if (res.isEnded) {
        gameContext.endGame(res.isWin);
      }
    });

    const unflipDebounce = useDebounce<number>(
      $(() => {
        if (gameContext.game.selectedCardIds.length === 2) {
          handleAddToSuccessfulPairsIfMatching();
        }
        gameContext.game.flippedCardId = -1;
        unflippedTime.value = Date.now();
      }),
      MINIMUM_CARD_VIEW_TIME
    );

    const runUnflipDebounce = $((time: number) => {
      unflipDebounce.setDelay(time);
      unflipDebounce.setValue(-1);
    });

    const handleClickCard = $((cardId: number) => {
      // to prevent card from returning super quick
      flippedTime.value = Date.now();

      const newSelected = v3CardUtils.handleAddCardToSelected(
        [...gameContext.game.selectedCardIds],
        cardId
      );

      if (newSelected.length !== gameContext.game.selectedCardIds.length) {
        gameContext.game.selectedCardIds = newSelected;

        const isFinalPair =
          newSelected.length === 2 &&
          gameContext.game.successfulPairs.length ===
            gameContext.settings.deck.size / 2 - 1;

        // check immediately for the final pair
        if (isFinalPair) {
          // appStore.createTimestamp({ paused: true });
          gameContext.game.flippedCardId = cardId;
          gameContext.timer.pause();
          runUnflipDebounce(MINIMUM_CARD_VIEW_TIME * 1.5);
          return;
        }
      }

      // flip it either way
      gameContext.game.flippedCardId = cardId;
    });

    const clickDebounce = useDebounce<number>(
      $((clickedId) => {
        handleClickCard(Number(clickedId));
      }),
      MINIMUM_CARD_VIEW_TIME
    );

    const runClickDebounce = $((clickedId: number) => {
      clickDebounce.setDelay(
        MINIMUM_BETWEEN_CARDS - (Date.now() - unflippedTime.value)
      );
      clickDebounce.setValue(clickedId);
    });

    const handleClickBoard$ = $((e: QwikMouseEvent) => {
      const isCardFlipped = gameContext.game.flippedCardId !== -1;
      // attempt to get the card id if click is on a card
      // removed cards don't intercept click events, so they're filtered out automatically
      const clickedId = Number((e.target as HTMLElement).dataset.id) || false;

      const isClickedOnCard = !!clickedId;

      if (!isClickedOnCard && !isCardFlipped) return;

      // else, we care about the click
      // gameContext.timer.resume(); // resume if it were paused
      lastClick.value = Date.now();

      // unflip card if flipped
      if (isCardFlipped) {
        runUnflipDebounce(
          MINIMUM_CARD_VIEW_TIME - (Date.now() - flippedTime.value)
        );
      }
      // card is not flipped
      else if (isClickedOnCard) {
        // initialize game timer on first click
        if (!gameContext.timer.state.isStarted) {
          gameContext.startGame();
        }

        runClickDebounce(clickedId);
      }
    });

    useVisibleTask$((taskCtx) => {
      taskCtx.track(() => lastClick.value);
      console.log('autopause task runs:', {lastClick: lastClick.value});
      if (lastClick.value === -1) return;

      const timer = setTimeout(() => {
        console.log('timeout fired');
        gameContext.timer.pause();
        gameContext.interface.settingsModal.isShowing = true;
        lastClick.value === -1;
      }, lastClick.value + 5000);
      taskCtx.cleanup(() => clearTimeout(timer));
    });

    /*
     * niceity: esc will unflip a flipped card
     * */
    useOnWindow(
      "keydown",
      $((e) => {
        if ((e as KeyboardEvent).key === "Escape") {
          runUnflipDebounce(
            MINIMUM_CARD_VIEW_TIME - (Date.now() - flippedTime.value)
          );
        }
      })
    );

    /*
     * track window resizes to recalculate board
     * */
    useOnWindow(
      "resize",
      $(() => {
        if (gameContext.boardLayout.isLocked) return;

        const container = containerRef.value as HTMLElement; // or use window instead of container/game?
        const board = boardRef.value as HTMLElement;

        const boardRect = board.getBoundingClientRect();
        const boardTop = boardRect.top;
        const boardBottomLimit =
          (container.offsetHeight * (100 - CONTAINER_PADDING_PERCENT)) / 100; // account for padding on bottom
        const boardHeight = boardBottomLimit - boardTop;

        const boardWidth =
          (container.offsetWidth * (100 - CONTAINER_PADDING_PERCENT * 2)) / 100; // account for padding on sides

        const { cardLayout, boardLayout } = calculateLayouts(
          boardWidth,
          boardHeight,
          gameContext.settings.deck.size
        );

        gameContext.cardLayout = cardLayout;
        gameContext.boardLayout = {
          ...gameContext.boardLayout,
          ...boardLayout,
        };
      })
    );

    const adjustDeckSize = $((newDeckSize: number) => {
      console.log("~~ uvt$ deckSize changed:", {
        last: lastDeckSize.value,
        new: newDeckSize,
      });
      lastDeckSize.value = newDeckSize;

      if (gameContext.settings.deck.isLocked) {
        return;
      }
      gameContext.resetGame({
        ...gameContext.settings,
        deck: {
          ...gameContext.settings.deck,
          size: gameContext.settings.deck.size,
        },
      });

      if (gameContext.boardLayout.isLocked) {
        return;
      }
      gameContext.calculateAndResizeBoard(
        boardRef.value as HTMLDivElement,
        containerRef.value as HTMLDivElement
      );
    });

    const handleRefreshBoard = $((newRefresh: boolean) => {
      console.log("~~ uvt$ refreshBoard");
      lastRefresh.value = newRefresh;
      gameContext.calculateAndResizeBoard(
        boardRef.value as HTMLDivElement,
        containerRef.value as HTMLDivElement
      );
    });

    const initializeBoardAndDeck = $(async () => {
      console.log("~~ uvt$ should be only on mount!");
      await gameContext.calculateAndResizeBoard(
        boardRef.value as HTMLDivElement,
        containerRef.value as HTMLDivElement
      );
      gameContext.initializeDeck();
    });

    /* ================================
     * Handle Adjusting Board
     * - RUNS ON MOUNT
     * - also when "resize" flip-flops, or when deck.size changes
     * ================================ */

    useVisibleTask$(async (taskCtx) => {
      const newDeckSize = taskCtx.track(() => gameContext.settings.deck.size);
      const newRefresh = taskCtx.track(() => gameContext.settings.resizeBoard);
      const isDeckChanged = lastDeckSize.value !== newDeckSize;
      const isBoardRefreshed = lastRefresh.value !== newRefresh;

      // detect if resize caused the task to run
      if (isDeckChanged) {
        adjustDeckSize(newDeckSize);
        return;
      }

      if (isBoardRefreshed) {
        handleRefreshBoard(newRefresh);
        return;
      }

      // runs on mount only
      initializeBoardAndDeck();
    });

    /* ================================
     * Handles shuffling
     * - when shuffling state > 0, we shuffle a round and then decrement
     * ================================ */
    useVisibleTask$((taskCtx) => {
      const newState = taskCtx.track(() => gameContext.game.shufflingState);
      if (newState === 0) return;
      if (newState === 1) {
        // finish this round but stop after
        gameContext.stopShuffling();
      }
      // console.log(`shuffling ${newState} times`);

      gameContext.shuffleCardPositions();

      const nextStartTimer = setTimeout(() => {
        gameContext.game.shufflingState -= 1;
      }, CARD_SHUFFLE_PAUSE_DURATION + CARD_SHUFFLE_ACTIVE_DURATION);

      taskCtx.cleanup(() => {
        clearTimeout(nextStartTimer);
      });
    });

    /* ================================
     * Handle Shake Animation Timers
     * - when mismatching a pair, shake the cards
     *   - wait until card is returned before starting
     * ================================ */
    useTask$((taskCtx) => {
      taskCtx.track(() => gameContext.game.mismatchPair);
      if (gameContext.game.mismatchPair === "") return;

      // waits until flipped card is returned to the board
      const startAnimationTimeout = setTimeout(() => {
        gameContext.game.isShaking = true;
      }, SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD);

      const endAnimationTimeout = setTimeout(() => {
        gameContext.game.isShaking = false;
        gameContext.game.mismatchPair = "";
      }, SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD + CARD_SHAKE_ANIMATION_DURATION);

      taskCtx.cleanup(() => {
        clearTimeout(startAnimationTimeout);
        clearTimeout(endAnimationTimeout);
      });
    });

    useStyles$(`
      /* diable clicks  and mouse highlighting for all the innards */
      .card-flip * {
        pointer-events: none;
        user-select: none;
      }

      .card-flip {
        /*
          understanding cubic bezier: we control the two middle points
          [ t:0, p:0 ], (t:0.2, p:1.285), (t:0.32, p:1.075), [t:1, p:1]
          t == time, p == animationProgress
          e.g.:
          - so at 20%, our animation will be 128.5% complete,
          - then at 32% ouranimation will be 107.5% complete,
          - then finally at 100% our animation will complete
        * */
        transition-property: all;
/*         transition-timing-function: cubic-bezier(0.35, 1.2, 0.60, 1.045); */
        transition-timing-function: cubic-bezier(0.20, 1.285, 0.32, 1.075);
        transform-style: preserve-3d;
        transition-duration: ${CARD_FLIP_ANIMATION_DURATION}ms;
      }

      .card-shuffle-transform {
        transition-property: transform;
        transition-timing-function: cubic-bezier(0.40, 1.3, 0.62, 1.045);
        transition-duration: ${
          CARD_SHUFFLE_PAUSE_DURATION + CARD_SHUFFLE_ACTIVE_DURATION
        }ms;
      }

      .shake-card {
        animation: shake-card ${CARD_SHAKE_ANIMATION_DURATION}ms;
      }

      @keyframes shake-card {
        0% {
          transform: translate(0%,0%);
opacity: 1;
        }
        10% {
          transform: translate(-7%,1%);  
opacity: 0.95;
          box-shadow: 5px 0px 5px 5px rgba(255, 63, 63, 0.5);
        }
        23% {
          transform: translate(5%,1.8%);  
opacity: 0.91;
          box-shadow: -4px 0px 4px 4px rgba(255, 63, 63, 0.4);
        }
        56% {
          transform: translate(-3%,3.6%);  
opacity: 0.82;
          box-shadow: 3px 0px 3px 3px rgba(255, 63, 63, 0.3);
        }
        84% {
          transform: translate(1%,2.6%);  
opacity: 0.87;
          box-shadow: -2px 0px 2px 2px rgba(255, 63, 63, 0.2);
        }
        100% {
          transform: translate(0%,0%);  
opacity: 1;
          box-shadow: 1px 0px 1px 1px rgba(255, 63, 63, 0.1);
        }
      }
    `);

    return (
      <>
        <div
          class="relative max-h-full max-w-full w-full h-full items-center "
          ref={boardRef}
          onClick$={handleClickBoard$}
          data-label="board"
        >
          {gameContext.game.cards.map((card) => (
            <V3Card card={card} key={card.id} />
          ))}
        </div>
      </>
    );
  }
);
