import {
  $,
  component$,
  useComputed$,
  useContext,
  useOnWindow,
  useSignal,
  useStyles$,
  useVisibleTask$,
} from "@builder.io/qwik";
import { GameContext } from "~/v3/context/gameContext";
import cardUtils from "~/v3/utils/cardUtils";
import useDebounceSignal from "~/v3/hooks/useDebounce";
import { useTimeoutObj } from "~/v3/hooks/useTimeout";
import { calculateLayouts } from "~/v3/utils/boardUtils";
import Card from "~/v3/components/organisms/card/card";
import { BOARD } from "~/v3/constants/board";
import { GAME } from "~/v3/constants/game";

import type { Pair } from "~/v3/types/types";
import type { Signal } from "@builder.io/qwik";

export default component$(
  ({ containerRef }: { containerRef: Signal<HTMLElement | undefined> }) => {
    const gameContext = useContext(GameContext);
    const boardRef = useSignal<HTMLDivElement>();

    const lastDeckSize = useSignal(gameContext.userSettings.deck.size);
    const lastRefresh = useSignal(gameContext.userSettings.board.resize);

    const lastClick = useSignal(-1);

    const isCardFlipped = useComputed$(
      () => gameContext.game.flippedCardId !== -1
    );

    const handleAddToSuccessfulPairsIfMatching = $(async () => {
      const [cardId1, cardId2] = gameContext.game.selectedCardIds;
      const pair: Pair = `${cardId1}:${cardId2}`;
      // run checkMatch
      const card1 = cardUtils.findCardById(gameContext.game.cards, cardId1);
      const card2 = cardUtils.findCardById(gameContext.game.cards, cardId2);
      const isMatch = cardUtils.checkMatch(card1, card2);

      // console.log({ isMatch, card1, card2 });

      if (!isMatch) {
        gameContext.game.mismatchPairs = [
          ...gameContext.game.mismatchPairs,
          pair
        ];
        gameContext.game.mismatchPair = pair;
        gameContext.interface.mismatchAnimation = true;
      } else {
        // add to our pairs
        gameContext.game.successfulPairs = [
          ...gameContext.game.successfulPairs,
          pair
        ];

        // TODO:
        // some success animation to indicate a pair,
        // like a sparkle or a background blur around the pairs count
        gameContext.interface.successAnimation = true;
      }

      // clear our selectedCards
      gameContext.game.selectedCardIds = [];

      // finally finally, check for end conditions
      gameContext.isGameEnded().then(res => {
        if (res.isEnded) {
          gameContext.endGame(res.isWin);
        }
      });
    });

    const unflipCard = $(async () => {
      if (gameContext.game.selectedCardIds.length === 2) {
        await handleAddToSuccessfulPairsIfMatching();
      }
      gameContext.game.flippedCardId = -1;
      lastClick.value = Date.now();
    });

    const unflipDebounce = useDebounceSignal<number>({
      _action$: unflipCard,
      _delay: BOARD.MINIMUM_TIME_BETWEEN_CLICKS,
    });

    // runs when the clicked item is a card
    const handleClickUnflippedCard = $((cardId: number) => {
      // console.log("handleClickUnflippedCard", { cardId });

      const newSelected = cardUtils.handleAddCardToSelected(
        [...gameContext.game.selectedCardIds],
        cardId
      );

      if (newSelected.length !== gameContext.game.selectedCardIds.length) {
        gameContext.game.selectedCardIds = newSelected;

        const isFinalPair =
          newSelected.length === 2 &&
          gameContext.game.successfulPairs.length ===
          gameContext.userSettings.deck.size / 2 - 1;

        // check immediately for the final pair
        if (isFinalPair) {
          gameContext.game.flippedCardId = cardId;
          gameContext.timer.pause();
          // runUnflipDebounce(BOARD.MINIMUM_TIME_BETWEEN_CLICKS);
          unflipDebounce.callDebounce();
          return;
        }
      }

      // flip it either way
      gameContext.game.flippedCardId = cardId;
      lastClick.value = Date.now();
    });

    const handleClickCard = $((isClickedOnCard: boolean, clickedId: number) => {
      // unflip card if flipped
      if (isCardFlipped.value) {
        unflipCard();
        return;
      }
      // card is not flipped
      if (isClickedOnCard) {
        // initialize game timer on first click
        if (!gameContext.timer.state.isStarted) {
          gameContext.startGame();
        }

        // runClickUnflippedCardDebounce(clickedId);
        handleClickUnflippedCard(clickedId);
      }
    });

    const clickCardDebounce = useDebounceSignal<{
      isClickedOnCard: boolean;
      clickedId: number;
    }>({
      _action$: $((newValue: {
        isClickedOnCard: boolean;
        clickedId: number;
      }) => {
        const { isClickedOnCard, clickedId } = newValue;
        handleClickCard(isClickedOnCard, clickedId as number);
      }),
      _delay: BOARD.MINIMUM_TIME_BETWEEN_CLICKS,
    });

    const handleClickBoard$ = $((e: MouseEvent) => {
      const isCardFlipped = gameContext.game.flippedCardId !== -1;
      // attempt to get the card id if click is on a card
      // removed cards don't intercept click events, so they're filtered out automatically
      const clickedId = Number((e.target as HTMLElement).dataset.id) || false;

      const isClickedOnCard = !!clickedId;

      if (!isClickedOnCard && !isCardFlipped) return;

      clickCardDebounce.callDebounce({
        newValue: {
          isClickedOnCard,
          clickedId: clickedId as number,
        },
        delay:
          BOARD.MINIMUM_TIME_BETWEEN_CLICKS - (Date.now() - lastClick.value),
      });
    });

    // auto pause after some inactivity
    useTimeoutObj({
      action: $(() => {
        gameContext.timer.pause();
        gameContext.interface.settingsModal.isShowing = true;
        lastClick.value === -1;
      }),
      triggerCondition: useComputed$(
        () =>
          gameContext.timer.state.isStarted &&
          !gameContext.timer.state.isEnded &&
          lastClick.value !== -1
      ),
      initialDelay: BOARD.AUTO_PAUSE_DELAY_MS,
      checkConditionOnTimeout: true,
    });

    /*
     * niceity: esc will unflip a flipped card
     * TODO: this plays weird with settings esc key
     * */
    useOnWindow(
      "keydown",
      $((e) => {
        if ((e as KeyboardEvent).key === "Escape") {
          unflipDebounce.callDebounce({
            delay:
              BOARD.MINIMUM_TIME_BETWEEN_CLICKS -
              (Date.now() - lastClick.value),
          });
          // runUnflipDebounce(
          //   BOARD.MINIMUM_TIME_BETWEEN_CLICKS - (Date.now() - lastClick.value)
          // );
        }
      })
    );

    /*
     * track window resizes to recalculate board
     * */
    useOnWindow(
      "resize",
      $(() => {
        if (gameContext.userSettings.board.isLocked) return;

        const container = containerRef.value as HTMLElement; // or use window instead of container/game?
        const board = boardRef.value as HTMLElement;

        const boardRect = board.getBoundingClientRect();
        const boardTop = boardRect.top;
        const boardBottomLimit =
          (container.offsetHeight * (100 - GAME.CONTAINER_PADDING_PERCENT)) /
          100; // account for padding on bottom
        const boardHeight = boardBottomLimit - boardTop;

        const boardWidth =
          (container.offsetWidth * (100 - GAME.CONTAINER_PADDING_PERCENT * 2)) /
          100; // account for padding on sides

        const { cardLayout, boardLayout } = calculateLayouts(
          boardWidth,
          boardHeight,
          gameContext.userSettings.deck.size
        );

        gameContext.cardLayout = cardLayout;
        gameContext.boardLayout = {
          ...gameContext.boardLayout,
          ...boardLayout,
        };
      })
    );

    const adjustDeckSize = $((newDeckSize: number) => {
      lastDeckSize.value = newDeckSize;

      if (gameContext.userSettings.deck.isLocked) return;

      gameContext.resetGame({
        ...gameContext.userSettings,
        deck: {
          ...gameContext.userSettings.deck,
          size: gameContext.userSettings.deck.size,
        },
      });

      if (gameContext.userSettings.board.isLocked) return;

      gameContext.calculateAndResizeBoard(
        boardRef.value as HTMLDivElement,
        containerRef.value as HTMLDivElement
      );
    });

    /* ================================
     * Handle Adjusting Board
     * - RUNS ON MOUNT
     * - also when "resize" flip-flops, or when deck.size changes
     * ================================ */
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(
      async ({ track }) => {
        const newDeckSize = track(
          () => gameContext.userSettings.deck.size
        );
        const newRefresh = track(
          () => gameContext.userSettings.board.resize
        );
        const isDeckChanged = lastDeckSize.value !== newDeckSize;
        const isBoardRefreshed = lastRefresh.value !== newRefresh;

        // detect if resize caused the task to run
        if (isDeckChanged) {
          // console.log("~~ uvt$ deckSize changed:", {
          //   last: lastDeckSize.value,
          //   new: newDeckSize,
          // });
          adjustDeckSize(newDeckSize);
          return;
        }

        if (isBoardRefreshed) {
          // console.log("~~ uvt$ refreshBoard");
          lastRefresh.value = newRefresh;
          gameContext.calculateAndResizeBoard(
            boardRef.value as HTMLDivElement,
            containerRef.value as HTMLDivElement
          );
          return;
        }

        // runs on mount only
        // console.log("~~ uvt$ should be only on mount!");

        await gameContext.calculateAndResizeBoard(
          boardRef.value as HTMLDivElement,
          containerRef.value as HTMLDivElement
        );
        gameContext.initializeDeck();
      }
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
        transition-duration: ${BOARD.CARD_FLIP_ANIMATION_DURATION}ms;
      }

      .card-shuffle-transform {
        transition-property: transform;
        transition-timing-function: cubic-bezier(0.40, 1.3, 0.62, 1.045);
        transition-duration: ${BOARD.CARD_SHUFFLE_PAUSE_DURATION + BOARD.CARD_SHUFFLE_ACTIVE_DURATION
      }ms;
      }

      .shake-card {
        animation: shake-card ${BOARD.CARD_SHAKE_ANIMATION_DURATION}ms;
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
      <div
        class="relative h-full max-h-full w-full max-w-full items-center "
        ref={boardRef}
        onClick$={handleClickBoard$}
        data-label="board"
      >
        {gameContext.game.cards.map((card) => (
          <Card card={card} key={card.id} />
        ))}
      </div>
    );
  }
);
