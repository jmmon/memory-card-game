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

export const CARD_FLIP_ANIMATION_DURATION = 600;
export const CARD_SHAKE_ANIMATION_DURATION = 700;

export const CARD_RATIO = 113 / 157; // w / h
export const CORNERS_WIDTH_RATIO = 1 / 20;

// after initial instant transform, wait this long before starting animation
export const CARD_SHUFFLE_PAUSE_DURATION = 0;
// animation duration
export const CARD_SHUFFLE_ACTIVE_DURATION = 300;
export const CARD_SHUFFLE_ROUNDS = 5;

// higher means shake starts sooner
const START_SHAKE_ANIMATION_EAGER_MS = 100;
const START_SHAKE_WHEN_FLIP_DOWN_IS_PERCENT_COMPLETE = 0.9;
const SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD =
  CARD_FLIP_ANIMATION_DURATION *
    START_SHAKE_WHEN_FLIP_DOWN_IS_PERCENT_COMPLETE -
  START_SHAKE_ANIMATION_EAGER_MS;

const MINIMUM_CARD_VIEW_TIME = 500;

export default component$(
  ({ containerRef }: { containerRef: Signal<HTMLElement | undefined> }) => {
    const appStore = useContext(AppContext);
    const boardRef = useSignal<HTMLDivElement>();

    const lastDeckSize = useSignal(appStore.settings.deck.size);
    const lastRefresh = useSignal(appStore.settings.resizeBoard);

    const handleAddToSuccessfulPairsIfMatching = $(async () => {
      const [cardId1, cardId2] = appStore.game.selectedCardIds;
      const pair: Pair = `${cardId1}:${cardId2}`;
      // run checkMatch
      const card1 = v3CardUtils.findCardById(appStore.game.cards, cardId1);
      const card2 = v3CardUtils.findCardById(appStore.game.cards, cardId2);
      const isMatch = v3CardUtils.checkMatch(card1, card2);

      // console.log({ isMatch, card1, card2 });

      if (!isMatch) {
        appStore.game.mismatchPairs = [...appStore.game.mismatchPairs, pair];
        appStore.game.mismatchPair = pair;
      } else {
        // add to our pairs
        appStore.game.successfulPairs = [
          ...appStore.game.successfulPairs,
          pair,
        ];

        // TODO:
        // some success animation to indicate a pair,
        // like a sparkle or a background blur around the pairs count
      }

      // clear our selectedCards
      appStore.game.selectedCardIds = [];

      // finally finally, check for end conditions
      const res = await appStore.isGameEnded();

      if (res.isEnded) {
        appStore.endGame(res.isWin);
      }
    });

    const unflipCard$ = $(() => {
      if (appStore.game.selectedCardIds.length === 2) {
        handleAddToSuccessfulPairsIfMatching();
      }
      appStore.game.flippedCardId = -1;
    });

    const { setValue: debounceUnflipCard, setDelay: setDebounceDelay } =
      useDebounce<number>(unflipCard$, MINIMUM_CARD_VIEW_TIME);

    const flippedTime = useSignal(-1);

    const handleClickCard = $((cardId: number) => {
      // to prevent card from returning super quick
      flippedTime.value = Date.now();

      const newSelected = v3CardUtils.handleAddCardToSelected(
        [...appStore.game.selectedCardIds],
        cardId
      );

      if (newSelected.length !== appStore.game.selectedCardIds.length) {
        appStore.game.selectedCardIds = newSelected;

        const isFinalPair =
          newSelected.length === 2 &&
          appStore.game.successfulPairs.length + 1 ===
            appStore.settings.deck.size / 2;

        // check immediately for the final pair
        if (isFinalPair) {
          appStore.createTimestamp({ paused: true });
          appStore.game.flippedCardId = cardId;
          setDebounceDelay(MINIMUM_CARD_VIEW_TIME * 1.5);
          debounceUnflipCard(-1);
          return;
        }
      }

      // flip it either way
      appStore.game.flippedCardId = cardId;
    });

    const handleClickBoard$ = $((e: QwikMouseEvent) => {
      const isCardFlipped = appStore.game.flippedCardId !== -1;
      // attempt to get the card id if click is on a card
      // removed cards don't intercept click events, so they're filtered out automatically
      const clickedId = Number((e.target as HTMLElement).dataset.id) || false;

      const isClickedOnCard = !!clickedId;

      switch (true) {
        case isCardFlipped:
          {
            setDebounceDelay(
              MINIMUM_CARD_VIEW_TIME - (Date.now() - flippedTime.value)
            );
            debounceUnflipCard(-1);
          }
          break;

        // card is not flipped
        case isClickedOnCard:
          {
            // initialize game timer on first click
            if (!appStore.timer.state.isStarted) {
              appStore.startGame();
            }

            handleClickCard(Number(clickedId));
          }
          break;
      }
    });

    /*
     * niceity: esc will unflip a flipped card
     * */
    const handleUnflipCard = $(() => {
      appStore.game.flippedCardId = -1;
    });

    useOnWindow(
      "keydown",
      $((e) => {
        if ((e as KeyboardEvent).key === "Escape") {
          handleUnflipCard();
        }
      })
    );

    /*
     * track window resizes to recalculate board
     * */
    useOnWindow(
      "resize",
      $(() => {
        if (appStore.boardLayout.isLocked) return;

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
          appStore.settings.deck.size
        );

        appStore.cardLayout = cardLayout;
        appStore.boardLayout = {
          ...appStore.boardLayout,
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

      if (appStore.settings.deck.isLocked) {
        return;
      }
      appStore.resetGame({
        ...appStore.settings,
        deck: {
          ...appStore.settings.deck,
          size: appStore.settings.deck.size,
        },
      });

      if (appStore.boardLayout.isLocked) {
        return;
      }
      appStore.calculateAndResizeBoard(
        boardRef.value as HTMLDivElement,
        containerRef.value as HTMLDivElement
      );
    });

    const handleRefreshBoard = $((newRefresh: boolean) => {
      console.log("~~ uvt$ refreshBoard");
      lastRefresh.value = newRefresh;
      appStore.calculateAndResizeBoard(
        boardRef.value as HTMLDivElement,
        containerRef.value as HTMLDivElement
      );
    });

    const initializeBoardAndDeck = $(async () => {
      console.log("~~ uvt$ should be only on mount!");
      await appStore.calculateAndResizeBoard(
        boardRef.value as HTMLDivElement,
        containerRef.value as HTMLDivElement
      );
      appStore.initializeDeck();
    });

    /* ================================
     * Handle Adjusting Board
     * - RUNS ON MOUNT
     * - also when "resize" flip-flops, or when deck.size changes
     * ================================ */

    useVisibleTask$(async (taskCtx) => {
      const newDeckSize = taskCtx.track(() => appStore.settings.deck.size);
      const newRefresh = taskCtx.track(() => appStore.settings.resizeBoard);
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
      const newState = taskCtx.track(() => appStore.game.shufflingState);
      if (newState === 0) return;
      if (newState === 1) {
        // finish this round but stop after
        appStore.stopShuffling();
      }
      console.log(`shuffling ${newState} times`);

      appStore.shuffleCardPositions();

      const nextStartTimer = setTimeout(() => {
        appStore.game.shufflingState -= 1;
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
      taskCtx.track(() => appStore.game.mismatchPair);
      if (appStore.game.mismatchPair === "") return;

      // waits until flipped card is returned to the board
      const startAnimationTimeout = setTimeout(() => {
        appStore.game.isShaking = true;
      }, SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD);

      const endAnimationTimeout = setTimeout(() => {
        appStore.game.isShaking = false;
        appStore.game.mismatchPair = "";
      }, SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD + CARD_SHAKE_ANIMATION_DURATION);

      taskCtx.cleanup(() => {
        clearTimeout(startAnimationTimeout);
        clearTimeout(endAnimationTimeout);
      });
    });

    useStyles$(`
      /* diable clicks for all the innards */
      .card-flip * {
        pointer-events: none;
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
        transition-timing-function: cubic-bezier(0.40, 1.2, 0.62, 1.045);
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
          transform: translateX(0%);
        }
        10% {
          transform: translateX(-7%);  
          box-shadow: 5px 0px 5px 5px rgba(255, 63, 63, 0.5);
        }
        23% {
          transform: translateX(5%);  
          box-shadow: -4px 0px 4px 4px rgba(255, 63, 63, 0.4);
        }
        56% {
          transform: translateX(-3%);  
          box-shadow: 3px 0px 3px 3px rgba(255, 63, 63, 0.3);
        }
        84% {
          transform: translateX(1%);  
          box-shadow: -2px 0px 2px 2px rgba(255, 63, 63, 0.2);
        }
        100% {
          transform: translateX(0%);  
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
          {appStore.game.cards.map((card) => (
            <V3Card card={card} key={card.id} />
          ))}
        </div>
      </>
    );
  }
);
