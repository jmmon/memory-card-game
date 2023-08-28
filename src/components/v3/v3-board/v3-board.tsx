import type { QwikMouseEvent, Signal } from "@builder.io/qwik";
import {
  $,
  component$,
  useContext,
  useOnWindow,
  useSignal,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
import { isServer } from "@builder.io/qwik/build";

import V3Card from "../v3-card/v3-card";
import { AppContext } from "../v3-context/v3.context";
import { v3GenerateCards, FULL_DECK_COUNT } from "../utils/v3CardUtils";
import type { Pair, V3Card as V3CardType } from "../v3-game/v3-game";
import { useDebounce } from "../utils/useDebounce";
// const CARD_RATIO = 2.5 / 3.5; // w / h
const CARD_RATIO = 113 / 157; // w / h
export const CORNERS_WIDTH_RATIO = 1 / 20;

export const CARD_SHUFFLE_DELAYED_START = 100;
export const CARD_SHUFFLE_DURATION = 400;
export const CARD_SHUFFLE_ROUNDS = 5;
/*
 * card utils
 *
 * */
export const buildSetFromPairs = (pairs: `${number}:${number}`[]) =>
  pairs.reduce((accum, cur) => {
    const [c1, c2] = cur.split(":");
    accum.add(Number(c1));
    accum.add(Number(c2));
    return accum;
  }, new Set<number>());

// find cardId inside pairs
export const isCardRemoved = (
  pairs: `${number}:${number}`[],
  cardId: number
) => {
  const removedCards = buildSetFromPairs(pairs);
  return removedCards.has(cardId);
};

export const checkMatch = (
  cardA: V3CardType | undefined,
  cardB: V3CardType | undefined
): boolean => {
  if (cardA === undefined || cardB === undefined) {
    return false;
  }
  return cardA.pairId === cardB.id && cardB.pairId === cardA.id;
};

export const findCardById = (cards: V3CardType[], id: number) =>
  cards.find((card) => card.id === id);

export default component$(
  ({ containerRef }: { containerRef: Signal<HTMLElement | undefined> }) => {
    const appStore = useContext(AppContext);
    const boardRef = useSignal<HTMLDivElement>();

    const calculateBoardSize = $(() => {
      const container = containerRef.value as HTMLElement; // or use window instead of container/game?
      const board = boardRef.value as HTMLElement;

      const PADDING_PERCENT = 1.5;
      const boardRect = board.getBoundingClientRect();
      const boardTop = boardRect.top;
      const boardBottomLimit =
        (container.offsetHeight * (100 - PADDING_PERCENT)) / 100; // account for padding on bottom
      const boardHeight = boardBottomLimit - boardTop;

      const boardWidth =
        (container.offsetWidth * (100 - PADDING_PERCENT * 2)) / 100; // account for padding on sides
      return { width: boardWidth, height: boardHeight };
    });

    const resizeBoard = $(async (width?: number, height?: number) => {
      const boardWidth = width || boardRef.value?.offsetWidth || 0;
      const boardHeight = height || boardRef.value?.offsetHeight || 0;
      // const boardWidth = boardRef.value?.offsetWidth  || 0;
      // const boardHeight = boardRef.value?.offsetHeight || 0;
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
        columns,
        rows,
      });
    });

    const handleAddToSuccessfulPairsIfMatching = $(() => {
      const [cardId1, cardId2] = appStore.game.selectedCardIds;
      const pair: Pair = `${cardId1}:${cardId2}`;
      // run checkMatch
      const card1 = findCardById(appStore.game.cards, cardId1);
      const card2 = findCardById(appStore.game.cards, cardId2);
      const isMatch = checkMatch(card1, card2);

      // console.log({ isMatch, card1, card2 });

      if (!isMatch) {
        appStore.game.mismatchPairs = [...appStore.game.mismatchPairs, pair];
        // TODO:
        // modify cards to mark them as incorrect
        if (card1) {
          card1.isMismatched = true;
        }
        if (card2) {
          card2.isMismatched = true;
        }
      } else {
        // add to our pairs
        appStore.game.successfulPairs = [
          ...appStore.game.successfulPairs,
          pair,
        ];

        // pop out the modal
        // MatchModalStore.modal = {
        //   isShowing: true,
        //   text: `MATCH! ${JSON.stringify(card1, null, 2)} and ${JSON.stringify(
        //     card2,
        //     null,
        //     2
        //   )}`,
        // };
      }

      // finally clear our selectedCards
      appStore.game.selectedCardIds = [];
    });

    const MINIMUM_VIEW_TIME = 500;
    const { setValue: debounceUnflipCard, setDelay } = useDebounce<number>(
      $((newVal) => {
        if (appStore.game.selectedCardIds.length === 2) {
          handleAddToSuccessfulPairsIfMatching();
        }
        appStore.game.flippedCardId = newVal;
      }),
      MINIMUM_VIEW_TIME
    );

    const flippedTime = useSignal(-1);

    const handleSelectCard = $(
      (selected: number[], id: number): number[] | false => {
        if (selected.length === 1 && id === selected[0]) {
          console.log("same one clicked.. doing nothing", selected);
          return selected;
        } else {
          selected = [...selected, id];
          console.log(
            selected.length === 1
              ? "no cards yet, adding to our array:"
              : "adding second card:",
            selected
          );
          return selected;
        }
      }
    );

    const handleClickBoard = $(async (e: QwikMouseEvent) => {
      // console.log("clicked board:", { event: e, target: e.target });
      const isCardFlipped = appStore.game.flippedCardId !== -1;
      // attempt to get the card id if click is on a card
      const clickedId = Number((e.target as HTMLElement).dataset.id) || false;
      const isClickedOnCard = !!clickedId;

      switch (true) {
        case isCardFlipped:
          {
            setDelay(MINIMUM_VIEW_TIME - (Date.now() - flippedTime.value));
            debounceUnflipCard(-1);
          }
          break;

        // card is not flipped
        case isClickedOnCard:
          {
            // check if it's already out of the game, if so we do nothing
            const cardId = clickedId as number;
            const isRemoved = isCardRemoved(
              appStore.game.successfulPairs,
              cardId
            );
            if (isRemoved) {
              return;
            }

            flippedTime.value = Date.now();

            const selected = await handleSelectCard(
              [...appStore.game.selectedCardIds],
              cardId
            );

            if (selected && selected?.length !== appStore.game.selectedCardIds.length) {
              // save it if it's a new card
              appStore.game.selectedCardIds = selected;
            }
            // flip it either way
            appStore.game.flippedCardId = cardId;
          }
          break;
      }
    });

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

    useOnWindow(
      "resize",
      $((e) => {
        if (appStore.boardLayout.isLocked) return;

        const container = containerRef.value as HTMLElement; // or use window instead of container/game?
        const board = boardRef.value as HTMLElement;

        const PADDING_PERCENT = 1.5;
        const boardRect = board.getBoundingClientRect();
        const boardTop = boardRect.top;
        const boardBottomLimit =
          (container.offsetHeight * (100 - PADDING_PERCENT)) / 100; // account for padding on bottom
        const boardHeight = boardBottomLimit - boardTop;

        const boardWidth =
          (container.offsetWidth * (100 - PADDING_PERCENT * 2)) / 100; // account for padding on sides

        resizeBoard(boardWidth, boardHeight);
      })
    );

    const calculateAndResizeBoard = $(async () => {
      const newBoard = await calculateBoardSize();

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
    });
    // // track deck size changes to adjust board
    // useVisibleTask$(async (taskCtx) => {
    //   taskCtx.track(() => appStore.settings.deck.size);
    //   console.log("deck size track task runs");
    //   if (appStore.settings.deck.isLocked) {
    //     return;
    //   }
    //   adjustDeckSize();
    //
    //   if (appStore.boardLayout.isLocked) {
    //     return;
    //   }
    //
    //   calculateAndResizeBoard();
    // });
    //
    // // calculate board on mount, and when forcing resize
    // useVisibleTask$(async (taskCtx) => {
    //   taskCtx.track(() => appStore.settings.resizeBoard);
    //   console.log("mount and resizeBoard task runs");
    //   calculateAndResizeBoard();
    // });

    const lastDeckSize = useSignal(appStore.settings.deck.size);
    const lastRefresh = useSignal(appStore.settings.resizeBoard);
    // track deck size changes to adjust board
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

      if (!isDeckChanged && !isBoardRefreshed) {
        console.log("~~ uvt$ should be only on mount!");
        calculateAndResizeBoard();
      }
    });

    const shuffleCounterSignal = useSignal(CARD_SHUFFLE_ROUNDS);

    // when shuffling, start timer to turn off after duration
    useVisibleTask$((taskCtx) => {
      taskCtx.track(() => appStore.game.isShuffling);

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
      } else {
      }

      if (appStore.game.isShuffling === false) return;

      console.log("start shuffling");

      // for activating animation (after initial instant transform)
      const delayedStart = setTimeout(() => {
        appStore.game.isShufflingDelayed = true;
        console.log("start animation");
      }, CARD_SHUFFLE_DELAYED_START);

      // deactivate shuffling & animation
      const shuffleTimeout = setTimeout(() => {
        appStore.game.isShuffling = false;
        appStore.game.isShufflingDelayed = false;
        console.log(
          `END shuffling: ${CARD_SHUFFLE_DURATION}ms #${shuffleCounterSignal.value}`
        );
        shuffleCounterSignal.value--;
      }, CARD_SHUFFLE_DURATION);

      // const delayedEnd = setTimeout(() => {
      // }, SHUFFLE_CARD_DURATION + CARD_SHUFFLE_DELAYED_START);

      taskCtx.cleanup(() => {
        clearTimeout(shuffleTimeout);
        clearTimeout(delayedStart);
        clearTimeout(rerun);
      });
    });

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
          onClick$={(e: QwikMouseEvent) => handleClickBoard(e)}
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
