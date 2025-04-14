import {
  $,
  component$,
  useComputed$,
  useSignal,
  useStyles$,
  useVisibleTask$,
} from "@builder.io/qwik";
import cardUtils from "~/v3/utils/cardUtils";
import useDebounceSignal from "~/v3/hooks/useDebounce";
import { useTimeoutObj } from "~/v3/hooks/useTimeout";
import Card from "~/v3/components/organisms/card/card";
import BOARD from "~/v3/constants/board";
import { DebugTypeEnum, LogLevel } from "~/v3/constants/game";

import type { iPair } from "~/v3/types/types";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";
import logger from "~/v3/services/logger";
import useDebouncedOnWindow from "~/v3/hooks/useDebouncedOnWindow";

export default component$(() => {
  const ctx = useGameContextService();
  const lastDeckSize = useSignal(ctx.state.userSettings.deck.size);
  const lastClick = useSignal(-1);

  const isAnyCardFlipped = useComputed$(
    () => ctx.state.gameData.flippedCardId !== -1,
  );

  const handleAddToSuccessfulPairsIfMatching = $(async () => {
    const [cardId1, cardId2] = ctx.state.gameData.selectedCardIds;
    const pair: iPair = `${cardId1}:${cardId2}`;
    // run checkMatch
    const card1 = cardUtils.findCardById(ctx.state.gameData.cards, cardId1);
    const card2 = cardUtils.findCardById(ctx.state.gameData.cards, cardId2);
    const isMatch = cardUtils.checkMatch(card1, card2);

    // console.log({ isMatch, card1, card2 });

    if (!isMatch) {
      ctx.state.gameData.mismatchPairs = [
        ...ctx.state.gameData.mismatchPairs,
        pair,
      ];
      ctx.state.gameData.mismatchPair = pair;
      // or instead of separate animation state, could watch the successfulPairs.length??
      ctx.state.interfaceSettings.mismatchAnimation = true;
    } else {
      // add to our pairs
      ctx.state.gameData.successfulPairs = [
        ...ctx.state.gameData.successfulPairs,
        pair,
      ];
      // or instead of separate animation state, could watch the successfulPairs.length??
      ctx.state.interfaceSettings.successAnimation = true;
    }

    // clear our selectedCards
    ctx.state.gameData.selectedCardIds = [];

    // finally finally, check for end conditions
    ctx.handle.isEndGameConditionsMet().then((result) => {
      if (result.isEnded) {
        ctx.handle.endGame(result.isWin);
      }
    });
  });

  const unflipCard = $(async () => {
    if (ctx.state.gameData.selectedCardIds.length === 2) {
      await handleAddToSuccessfulPairsIfMatching();
    }
    ctx.state.gameData.flippedCardId = -1;
    lastClick.value = Date.now();
  });

  const unflipDebounce = useDebounceSignal<number>({
    _delay: BOARD.MINIMUM_TIME_BETWEEN_CLICKS,
    _action$: unflipCard,
  });

  // runs when the clicked item is a card
  const handleClickUnflippedCard = $((cardId: number) => {
    // console.log("handleClickUnflippedCard", { cardId });

    const newSelected = cardUtils.handleAddCardToSelected(
      [...ctx.state.gameData.selectedCardIds],
      cardId,
    );

    if (newSelected.length !== ctx.state.gameData.selectedCardIds.length) {
      ctx.state.gameData.selectedCardIds = newSelected;

      const isFinalPair =
        newSelected.length === 2 &&
        ctx.state.gameData.successfulPairs.length ===
          ctx.state.userSettings.deck.size / 2 - 1;

      // check immediately for the final pair
      if (isFinalPair) {
        ctx.state.gameData.flippedCardId = cardId;
        ctx.timer.pause();
        unflipDebounce.callDebounce();
        return;
      }
    }

    // flip it either way
    ctx.state.gameData.flippedCardId = cardId;
    lastClick.value = Date.now();
  });

  const handleClickCard = $(
    ({
      isClickedOnCard,
      clickedId,
    }: {
      isClickedOnCard: boolean;
      clickedId: number;
    }) => {
      // unflip card if flipped
      if (isAnyCardFlipped.value) {
        unflipCard();
        return;
      }
      // card is not flipped
      if (isClickedOnCard) {
        // initialize game timer on first click
        if (!ctx.timer.state.isStarted) {
          ctx.handle.startGame();
        }

        handleClickUnflippedCard(clickedId);
      }
    },
  );

  const clickCardDebounce = useDebounceSignal<{
    isClickedOnCard: boolean;
    clickedId: number;
  }>({
    _action$: handleClickCard,
    _delay: BOARD.MINIMUM_TIME_BETWEEN_CLICKS,
  });

  const handleClickBoard$ = $((e: MouseEvent) => {
    // attempt to get the card id if click is on a card
    // removed cards don't intercept click events, so they're filtered out automatically
    // checks the data-id attribute, so whatever part of the card has that MUST take pointer events
    const clickedId = Number((e.target as HTMLElement).dataset.id) || false;

    const isClickedOnCard = !!clickedId;

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "handleClickBoard", {
      isAnyCardFlipped: isAnyCardFlipped.value,
      clickedId,
    });

    if (!isAnyCardFlipped.value && !isClickedOnCard) return;

    clickCardDebounce.callDebounce({
      newValue: {
        isClickedOnCard,
        clickedId: clickedId as number,
      },
      delay: BOARD.MINIMUM_TIME_BETWEEN_CLICKS - (Date.now() - lastClick.value),
    });
  });

  // auto pause game after some inactivity (in case you go away)
  useTimeoutObj({
    triggerCondition: useComputed$(
      () =>
        !ctx.state.interfaceSettings.settingsModal.isShowing &&
        !ctx.state.interfaceSettings.endOfGameModal.isShowing &&
        ctx.timer.state.isStarted &&
        !ctx.timer.state.isEnded &&
        lastClick.value !== -1,
    ),
    delay: BOARD.AUTO_PAUSE_DELAY_MS,
    action: $(() => {
      ctx.timer.pause();
      ctx.state.interfaceSettings.settingsModal.isShowing = true;
      lastClick.value === -1;
    }),
    checkConditionOnTimeout: true,
  });

  /*
   * track window resizes to recalculate board
   * */
  useDebouncedOnWindow("resize", ctx.handle.calculateAndResizeBoard, 250);

  /* ================================
   * Handle Adjusting Board
   * - RUNS ON MOUNT
   * - also when "resize" flip-flops, or when deck.size changes
   * ================================ */
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const newDeckSize = track(() => ctx.state.userSettings.deck.size);
    const isDeckChanged = lastDeckSize.value !== newDeckSize;

    if (isDeckChanged) {
      logger(
        DebugTypeEnum.TASK,
        LogLevel.ONE,
        "UVT: decksize change => calculateAndResizeBoard",
        {
          boardIsLocked: ctx.state.userSettings.board.isLocked,
          deckIsLocked: ctx.state.userSettings.deck.isLocked,
        },
      );

      lastDeckSize.value = newDeckSize;

      if (ctx.state.userSettings.deck.isLocked) return;
      ctx.handle.resetGame({
        ...ctx.state.userSettings,
        deck: {
          ...ctx.state.userSettings.deck,
          size: ctx.state.userSettings.deck.size,
        },
      });

      ctx.handle.calculateAndResizeBoard();
      return;
    }

    // runs on mount only

    logger(
      DebugTypeEnum.TASK,
      LogLevel.ONE,
      "UVT: mount => calculateAndResize",
    );
    await ctx.handle.calculateAndResizeBoard();

    ctx.handle.initializeDeck(true);
  });

  useStyles$(`
/* move to global? unless it uses variables */
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
      transition-duration: ${
        BOARD.CARD_SHUFFLE_PAUSE_DURATION + BOARD.CARD_SHUFFLE_ACTIVE_DURATION
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

  logger(DebugTypeEnum.RENDER, LogLevel.TWO, "RENDER board.tsx");

  return (
    <div
      class={`relative h-full max-h-full w-full max-w-full items-center ${isAnyCardFlipped.value ? "cursor-pointer" : ""}`}
      ref={ctx.boardRef}
      onClick$={handleClickBoard$}
      data-label="board"
    >
      {ctx.state.gameData.cards.map((card, i) => (
        <Card card={card} key={card.id} index={i} />
      ))}
    </div>
  );
});
