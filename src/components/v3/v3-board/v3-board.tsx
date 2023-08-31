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
import {
  checkIfCardIsRemoved,
  checkMatch,
  findCardById,
  handleSelectCard,
} from "../utils/v3CardUtils";

export const CARD_FLIP_ANIMATION_DURATION = 600;
export const CARD_SHAKE_ANIMATION_DURATION = 700;

export const CARD_RATIO = 113 / 157; // w / h
export const CORNERS_WIDTH_RATIO = 1 / 20;

// after initial instant transform, wait this long before starting animation
export const CARD_SHUFFLE_DELAYED_START = 200;
// animation duration
export const CARD_SHUFFLE_ACTIVE_DURATION = 400;
export const CARD_SHUFFLE_ROUNDS = 5;

// higher means shake starts sooner
const START_SHAKE_ANIMATION_EAGER_MS = 100;
const START_SHAKE_WHEN_FLIP_DOWN_IS_PERCENT_COMPLETE = 0.9;
const SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD =
  CARD_FLIP_ANIMATION_DURATION *
    START_SHAKE_WHEN_FLIP_DOWN_IS_PERCENT_COMPLETE -
  START_SHAKE_ANIMATION_EAGER_MS;

const calculateBoardDimensions = (
  container: HTMLElement,
  board: HTMLElement
) => {
  // const container = containerRef.value as HTMLElement; // or use window instead of container/game?
  // const board = boardRef.value as HTMLElement;

  const boardRect = board.getBoundingClientRect();
  const boardTop = boardRect.top;
  const boardBottomLimit =
    (container.offsetHeight * (100 - CONTAINER_PADDING_PERCENT)) / 100; // account for padding on bottom
  const boardHeight = boardBottomLimit - boardTop;

  const boardWidth =
    (container.offsetWidth * (100 - CONTAINER_PADDING_PERCENT * 2)) / 100; // account for padding on sides

  return { width: boardWidth, height: boardHeight };
};

export default component$(
  ({ containerRef }: { containerRef: Signal<HTMLElement | undefined> }) => {
    const appStore = useContext(AppContext);
    const boardRef = useSignal<HTMLDivElement>();

    const resizeBoard = $(async (width?: number, height?: number) => {
      const boardWidth = width || boardRef.value?.offsetWidth || 0;
      const boardHeight = height || boardRef.value?.offsetHeight || 0;
      const boardArea = boardWidth * boardHeight;

      const maxAreaPerCard = boardArea / appStore.settings.deck.size; // to get approx cols/rows

      // width first approach
      const maxWidthPerCard = Math.sqrt(maxAreaPerCard * CARD_RATIO);
      const columns = Math.floor(boardWidth / maxWidthPerCard);
      const rows = Math.ceil(appStore.settings.deck.size / columns);

      // max height per card is restricted by number of rows:
      const newCardHeight = boardHeight / rows;
      const newCardWidth = newCardHeight * CARD_RATIO;
      const cardArea = newCardWidth * newCardHeight;

      appStore.cardLayout = {
        width: newCardWidth,
        height: newCardHeight,
        roundedCornersPx: CORNERS_WIDTH_RATIO * newCardWidth,
        area: cardArea,
      };

      // save board width/height
      appStore.boardLayout = {
        ...appStore.boardLayout,
        width: boardWidth,
        height: boardHeight,
        area: boardArea,
        rows,
        columns,
      };

      console.log({
        board: appStore.boardLayout,
        card: appStore.cardLayout,
        container: {
          width: containerRef.value?.offsetWidth,
          height: containerRef.value?.offsetHeight,
        },
        window: { width: window.innerWidth, height: window.innerHeight },
        columns,
        rows,
      });
    });

    const handleAddToSuccessfulPairsIfMatching = $(async () => {
      const [cardId1, cardId2] = appStore.game.selectedCardIds;
      const pair: Pair = `${cardId1}:${cardId2}`;
      // run checkMatch
      const card1 = findCardById(appStore.game.cards, cardId1);
      const card2 = findCardById(appStore.game.cards, cardId2);
      const isMatch = checkMatch(card1, card2);

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

        // some success animation to indicate a pair,
        // like a sparkle or a background blur around the pairs count
      }

      // clear our selectedCards
      appStore.game.selectedCardIds = [];

      // finally finally, check for end conditions
      const res = await appStore.isGameEnded();
      if (res.isEnded) {
        appStore.interface.endOfGameModal.isWin = res.isWin ?? false;
        appStore.interface.endOfGameModal.isShowing = true;
      }
    });

    const unflipCard$ = $(() => {
      if (appStore.game.selectedCardIds.length === 2) {
        handleAddToSuccessfulPairsIfMatching();
      }
      appStore.game.flippedCardId = -1;
    });

    const MINIMUM_VIEW_TIME = 500;
    const { setValue: debounceUnflipCard, setDelay: setDebounceDelay } =
      useDebounce<number>(unflipCard$, MINIMUM_VIEW_TIME);

    const flippedTime = useSignal(-1);

    const handleClickCard = $(async (cardId: number) => {
      // to prevent card from returning super quick
      flippedTime.value = Date.now();

      const newSelected = handleSelectCard(
        [...appStore.game.selectedCardIds],
        cardId
      );

      const wasCardSelected =
        newSelected &&
        newSelected.length !== appStore.game.selectedCardIds.length;

      if (wasCardSelected) {
        appStore.game.selectedCardIds = newSelected;

        const isFinalPair =
          newSelected.length === 2 &&
          appStore.game.successfulPairs.length + 1 ===
            appStore.settings.deck.size / 2;

        // check immediately for the final pair
        if (isFinalPair) {
          appStore.createTimestamp({ paused: true });
          appStore.game.flippedCardId = cardId;
          setDebounceDelay(MINIMUM_VIEW_TIME * 1.5);
          debounceUnflipCard(-1);
          return;
        }
      }

      // flip it either way
      appStore.game.flippedCardId = cardId;
    });

    const handleClickBoard$ = $(async (e: QwikMouseEvent) => {
      // console.log("clicked board:", { event: e, target: e.target });
      const isCardFlipped = appStore.game.flippedCardId !== -1;
      // attempt to get the card id if click is on a card
      const clickedId = Number((e.target as HTMLElement).dataset.id) || false;

      const isClickedOnCard = !!clickedId;

      switch (true) {
        case isCardFlipped:
          {
            setDebounceDelay(
              MINIMUM_VIEW_TIME - (Date.now() - flippedTime.value)
            );
            debounceUnflipCard(-1);
          }
          break;

        // card is not flipped
        case isClickedOnCard:
          {
            // initialize game timer
            const isFirstClick = appStore.game.time.timestamps.length === 0;

            if (isFirstClick) {
              appStore.game.isStarted = true;
              appStore.createTimestamp({ paused: false });
            }

            const cardId = checkIfCardIsRemoved(
              appStore.game.successfulPairs,
              Number(clickedId)
            );

            if (cardId !== -1) {
              handleClickCard(cardId);
            }
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

        resizeBoard(boardWidth, boardHeight);
      })
    );

    const calculateAndResizeBoard = $(() => {
      const newBoard = calculateBoardDimensions(
        containerRef.value as HTMLElement,
        boardRef.value as HTMLElement
      );
      resizeBoard(newBoard.width, newBoard.height);
    });

    const adjustDeckSize = $(() => {
      appStore.sliceDeck();

      appStore.shuffleCardPositions();

      // reset stats
      appStore.game.selectedCardIds = [];
      appStore.game.flippedCardId = -1;
      appStore.game.mismatchPairs = [];
      appStore.game.successfulPairs = [];

      // TODO:
      // instead, do:
      // appStore.resetGame({deck: {size: appStore.settings.deck.size}});
    });

    /* ================================
     * Handle Adjusting Board
     * - when "resize" flips or deck.size changes, recalculate
     * ================================ */
    const lastDeckSize = useSignal(appStore.settings.deck.size);
    const lastRefresh = useSignal(appStore.settings.resizeBoard);

    useVisibleTask$(async (taskCtx) => {
      const newDeckSize = taskCtx.track(() => appStore.settings.deck.size);
      const newRefresh = taskCtx.track(() => appStore.settings.resizeBoard);
      const isDeckChanged = lastDeckSize.value !== newDeckSize;
      const isBoardRefreshed = lastRefresh.value !== newRefresh;
      // detect if resize caused the task to run
      if (isDeckChanged) {
        console.log("~~ uvt$ deckSize changed:", {
          last: lastDeckSize.value,
          new: newDeckSize,
        });
        lastDeckSize.value = newDeckSize;

        if (appStore.settings.deck.isLocked) {
          return;
        }
        adjustDeckSize();

        if (appStore.boardLayout.isLocked) {
          return;
        }
        calculateAndResizeBoard();
        return;
      }

      if (isBoardRefreshed) {
        console.log("~~ uvt$ refreshBoard", {
          lastRefresh: lastRefresh.value,
          newRefresh,
        });
        lastRefresh.value = newRefresh;
        calculateAndResizeBoard();
        return;
      }

      console.log("~~ uvt$ should be only on mount!");
      appStore.sliceDeck();
      calculateAndResizeBoard();
    });

    /* ================================
     * Handle Shuffling card animation timers
     * TODO:
     * integrate shuffleCounter better into the shuffle function
     * e.g. appStore.shuffleCards(count: <0-5>);
     * 0 === shuffle once without animation
     * 1-5 === shuffle n times with animation
     * ================================ */
    const shuffleCounterSignal = useSignal(CARD_SHUFFLE_ROUNDS);

    // when shuffling, start timer to turn off after duration
    useVisibleTask$((taskCtx) => {
      taskCtx.track(() => appStore.game.isShufflingAnimation);

      let rerun: ReturnType<typeof setTimeout>;
      if (shuffleCounterSignal.value > 0) {
        // run again
        rerun = setTimeout(() => {
          appStore.shuffleCardPositions();
        }, 0);
      } else if (shuffleCounterSignal.value < CARD_SHUFFLE_ROUNDS) {
        appStore.game.isLoading = false;
        shuffleCounterSignal.value = CARD_SHUFFLE_ROUNDS;
        return;
      }

      if (appStore.game.isShufflingAnimation === false) return;

      console.log("start shuffling");

      // for activating animation (after initial instant transform)
      const delayedStart = setTimeout(() => {
        appStore.game.isShufflingDelayed = true;
        console.log("start animation");
      }, CARD_SHUFFLE_DELAYED_START);

      // deactivate shuffling & animation
      const shuffleTimeout = setTimeout(() => {
        appStore.game.isShufflingAnimation = false;
        appStore.game.isShufflingDelayed = false;
        console.log(
          `END shuffling: ${CARD_SHUFFLE_ACTIVE_DURATION}ms #${shuffleCounterSignal.value}`
        );
        shuffleCounterSignal.value--;
      }, CARD_SHUFFLE_DELAYED_START + CARD_SHUFFLE_ACTIVE_DURATION);

      taskCtx.cleanup(() => {
        clearTimeout(shuffleTimeout);
        clearTimeout(delayedStart);
        clearTimeout(rerun);
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

      // turn on shake after card returns to its space
      const timeout = setTimeout(() => {
        appStore.game.isShaking = true;
      }, SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD);

      taskCtx.cleanup(() => {
        clearTimeout(timeout);
      });
    });

    // handle turn off shake animation
    useTask$((taskCtx) => {
      taskCtx.track(() => appStore.game.isShaking);
      if (appStore.game.isShaking === false) return;

      const timeout = setTimeout(() => {
        appStore.game.isShaking = false;
        appStore.game.mismatchPair = "";
      }, CARD_SHAKE_ANIMATION_DURATION);

      taskCtx.cleanup(() => {
        clearTimeout(timeout);
      });
    });

    useStyles$(`
     .card * {
        pointer-events: none;
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
          class="grid max-h-full max-w-full flex-grow items-center"
          style={{
            gridTemplateColumns: `repeat(${
              appStore.boardLayout.columns || 4
            }, 1fr)`,
            gridTemplateRows: `repeat(${appStore.boardLayout.rows}, 1fr)`,
          }}
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

// alternate way to handle positioning:
// flex container
// cards dynamic sizing
// when card is removed, need to leave a "ghost" slot to take up the space (or else the cards will slide up to fill in slots)
