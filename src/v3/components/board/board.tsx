import type { QwikMouseEvent, Signal } from "@builder.io/qwik";
import {
  $,
  component$,
  useComputed$,
  useContext,
  useOnWindow,
  useSignal,
  useStyles$,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
import { GameContext } from "~/v3/context/gameContext";
import type { Pair } from "~/v3/types/types";
import v3CardUtils from "~/v3/utils/cardUtils";
import { useDebounce } from "~/v3/utils/useDebounce";
import { useTimeout } from "~/v3/utils/useTimeout";
import CONSTANTS from "~/v3/utils/constants";
import Card from "../card/card";
// import { useWindowSize } from "~/v3/utils/useWindowSize";

export default component$(
  ({ containerRef }: { containerRef: Signal<HTMLElement | undefined> }) => {
    const gameContext = useContext(GameContext);
    const boardRef = useSignal<HTMLDivElement>();

    const lastDeckSize = useSignal(gameContext.settings.deck.size);
    const lastRefresh = useSignal(gameContext.settings.resizeBoard);

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

    const unflipCard = $(async () => {
      console.log("unflipCard");
      if (gameContext.game.selectedCardIds.length === 2) {
        console.log("selectedCardids.length of 2");
        await handleAddToSuccessfulPairsIfMatching();
      }
      gameContext.game.flippedCardId = -1;
      lastClick.value = Date.now();
    });

    const unflipDebounce = useDebounce<number>(
      unflipCard,
      CONSTANTS.GAME.MINIMUM_TIME_BETWEEN_CLICKS,
    );

    const runUnflipDebounce = $((time: number) => {
      unflipDebounce.setDelay(time);
      unflipDebounce.setValue(-1);
    });

    // runs when the clicked item is a card
    const handleClickUnflippedCard = $((cardId: number) => {
      console.log("handleClickUnflippedCard", { cardId });

      const newSelected = v3CardUtils.handleAddCardToSelected(
        [...gameContext.game.selectedCardIds],
        cardId,
      );
      console.log({
        newSelected,
        oldSelected: gameContext.game.selectedCardIds,
      });

      // flip it either way
      gameContext.game.flippedCardId = cardId;
      lastClick.value = Date.now();

      // if we selected a new ard
      if (newSelected.length !== gameContext.game.selectedCardIds.length) {
        gameContext.game.selectedCardIds = newSelected;

        // if (newSelected.length === 2) {
        //   console.log("have 2 cards selected, should unflip card");
        //   runUnflipDebounce(MINIMUM_TIME_BETWEEN_CLICKS);
        // }

        const isFinalPair =
          newSelected.length === 2 &&
          gameContext.game.successfulPairs.length ===
            gameContext.settings.deck.size / 2 - 1;

        // check immediately for the final pair
        if (isFinalPair) {
          gameContext.timer.pause();
          runUnflipDebounce(CONSTANTS.GAME.MINIMUM_TIME_BETWEEN_CLICKS);
        }
      }
    });

    const clickCardDebounce = useDebounce<{
      isCardFlipped: boolean;
      isClickedOnCard: boolean;
      clickedId: number;
    }>(
      $((values) => {
        const { isCardFlipped, isClickedOnCard, clickedId } = values as {
          isCardFlipped: boolean;
          isClickedOnCard: boolean;
          clickedId: number;
        };

        // unflip card if flipped
        if (isCardFlipped) {
          unflipCard();
        }
        // card is not flipped
        else if (isClickedOnCard) {
          // initialize game timer on first click
          if (!gameContext.timer.state.isStarted) {
            gameContext.startGame();
          }

          // runClickUnflippedCardDebounce(clickedId);
          handleClickUnflippedCard(clickedId);
        }
      }),
      CONSTANTS.GAME.MINIMUM_TIME_BETWEEN_CLICKS,
    );

    const runClickCardDebounce = $(
      ({
        isCardFlipped,
        isClickedOnCard,
        clickedId,
      }: {
        isCardFlipped: boolean;
        isClickedOnCard: boolean;
        clickedId: number;
      }) => {
        clickCardDebounce.setDelay(
          CONSTANTS.GAME.MINIMUM_TIME_BETWEEN_CLICKS -
            (Date.now() - lastClick.value),
          // MINIMUM_TIME_BETWEEN_CLICKS
        );
        clickCardDebounce.setValue({
          isCardFlipped,
          isClickedOnCard,
          clickedId,
        });
      },
    );

    const handleClickBoard$ = $((e: QwikMouseEvent) => {
      const isCardFlipped = gameContext.game.flippedCardId !== -1;
      // attempt to get the card id if click is on a card
      // removed cards don't intercept click events, so they're filtered out automatically
      const clickedId = Number((e.target as HTMLElement).dataset.id) || false;

      const isClickedOnCard = !!clickedId;

      // clicked on board while card is not flipped, do nothing
      if (!isClickedOnCard && !isCardFlipped) return;

      // TODO: if card is flipped return unless card is returned to board
      // const isWaitingForCardToReturn =
      //   !gameContext.game.isReturned && gameContext.game.flippedCardId === -1;
      // if (isWaitingForCardToReturn) return;

      // either: click on card or click while card is flipped ( so we unflip it)
      runClickCardDebounce({
        isCardFlipped,
        isClickedOnCard,
        clickedId: clickedId as number,
      });
    });

    // auto pause after some inactivity
    useTimeout(
      $(() => {
        gameContext.timer.pause();
        gameContext.interface.settingsModal.isShowing = true;
        lastClick.value === -1;
      }),
      useComputed$(
        () =>
          gameContext.timer.state.isStarted &&
          !gameContext.timer.state.isEnded &&
          lastClick.value !== -1,
      ),
      CONSTANTS.GAME.AUTO.PAUSE_DELAY_MS,
      true,
    );

    /*
     * niceity: esc will unflip a flipped card
     * */
    useOnWindow(
      "keydown",
      $((e) => {
        if ((e as KeyboardEvent).key === "Escape") {
          runUnflipDebounce(
            CONSTANTS.GAME.MINIMUM_TIME_BETWEEN_CLICKS -
              (Date.now() - lastClick.value),
          );
        }
      }),
    );

    /*
     * track window resizes to recalculate board
     * */
    useOnWindow(
      "resize",
      $(() => {
        if (gameContext.boardLayout.isLocked) return;

        gameContext.calculateAndResizeBoard(
          containerRef.value as HTMLDivElement,
          boardRef.value as HTMLDivElement,
        );
      }),
    );

    const adjustDeckSize = $((newDeckSize: number) => {
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
        containerRef.value as HTMLDivElement,
      );
    });

    /* ================================
     * Handle Adjusting Board
     * - RUNS ON MOUNT
     * - also when "resize" flip-flops, or when deck.size changes
     * ================================ */
    useVisibleTask$(
      async (taskCtx) => {
        const newDeckSize = taskCtx.track(() => gameContext.settings.deck.size);
        const newRefresh = taskCtx.track(
          () => gameContext.settings.resizeBoard,
        );
        const isDeckChanged = lastDeckSize.value !== newDeckSize;
        const isBoardRefreshed = lastRefresh.value !== newRefresh;

        // detect if resize caused the task to run
        if (isDeckChanged) {
          console.log("~~ uvt$ deckSize changed:", {
            last: lastDeckSize.value,
            new: newDeckSize,
          });
          adjustDeckSize(newDeckSize);
          return;
        }

        if (isBoardRefreshed) {
          console.log("~~ uvt$ refreshBoard");
          lastRefresh.value = newRefresh;
          gameContext.calculateAndResizeBoard(
            boardRef.value as HTMLDivElement,
            containerRef.value as HTMLDivElement,
          );
          return;
        }

        // runs on mount only
        console.log("~~ uvt$ should be only on mount!");

        await gameContext.calculateAndResizeBoard(
          boardRef.value as HTMLDivElement,
          containerRef.value as HTMLDivElement,
        );
        gameContext.initializeDeck();
      },
      { strategy: "document-idle" },
    );

    useStyles$(`
      .card-face img {
        width: 100%;
        height: auto;
        display: block;
      }

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
        transition-duration: ${CONSTANTS.CARD.ANIMATIONS.FLIP}ms;
      }

      .card-shuffle-transform {
        transition-property: transform;
        transition-timing-function: cubic-bezier(0.40, 1.3, 0.62, 1.045);
        transition-duration: ${
          CONSTANTS.CARD.ANIMATIONS.SHUFFLE_PAUSE +
          CONSTANTS.CARD.ANIMATIONS.SHUFFLE_ACTIVE
        }ms;
      }

      .shake-card {
        animation: shake-card ${CONSTANTS.CARD.ANIMATIONS.SHAKE}ms;
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

    // when card is flipped, control timers for isFaceShowing and isFaceShowing_delayedOff
    // when showing the back side, partway through we reveal the back side.
    // when going back to the board, partway through we hide the back side.
    useTask$((taskCtx) => {
      const id = taskCtx.track(() => gameContext.game.flippedCardId);
      const isCardFlipped = id !== -1;

      let undersideRevealDelayTimer: ReturnType<typeof setTimeout>;
      let flippedDelayTimer: ReturnType<typeof setTimeout>;
      let returnedTimer: ReturnType<typeof setTimeout>;

      if (isCardFlipped) {
        // when showing card
        gameContext.game.isFaceShowing = true;
        gameContext.game.isFaceShowing_delayedOff = true;
        gameContext.game.isReturned = false;
      } else {
        // when hiding card, keep the underside visible for a while
        undersideRevealDelayTimer = setTimeout(() => {
          gameContext.game.isFaceShowing = isCardFlipped;
        }, CONSTANTS.CARD.ANIMATIONS.FLIP * CONSTANTS.CARD.ANIMATIONS.HIDE_UNDERSIDE_AFTER_RETURN_PERCENT_COMPLETE);

        flippedDelayTimer = setTimeout(() => {
          gameContext.game.isFaceShowing_delayedOff = isCardFlipped;
        }, CONSTANTS.CARD.ANIMATIONS.FLIP_DELAYED_OFF);

        returnedTimer = setTimeout(() => {
          gameContext.game.isReturned = !isCardFlipped;
        }, CONSTANTS.CARD.ANIMATIONS.FLIP);
      }

      taskCtx.cleanup(() => {
        clearTimeout(undersideRevealDelayTimer);
        clearTimeout(flippedDelayTimer);
        clearTimeout(returnedTimer);
      });
    });

    return (
      <div
        class={`relative max-h-full max-w-full w-full h-full items-center`}
        ref={boardRef}
        onClick$={handleClickBoard$}
        data-label="board"
      >
        {gameContext.game.cards.map((card) => (
          <Card card={card} key={card.id} />
        ))}
      </div>
    );
  },
);
