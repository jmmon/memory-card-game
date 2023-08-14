import {
  $,
  QwikMouseEvent,
  component$,
  useContext,
  useOnWindow,
  useSignal,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
import V3Card from "../v3-card/v3-card";
import { AppContext } from "../v3-context/v3.context";
import {
  DeckOfCardsApi_Card,
  formatCards,
  getNewCards,
  v3GenerateCards,
} from "../utils/v3CardUtils";
import { Pair, V3Card as V3CardType } from "../v3-game/v3-game";
// const CARD_RATIO = 2.5 / 3.5; // w / h
const CARD_RATIO = 113 / 157; // w / h
export const CORNERS_WIDTH_RATIO = 1 / 20;

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

const handleSelectCard = (selected: number[], id: number): number[] | false => {
  // if no cards are selected, push the card id
  if (selected.length === 0) {
    selected = [id];
    console.log("no cards yet, adding to our array:", selected);
    return selected;
  }

  // if one card is selected: {
  //   if it's the same card, do nothing
  //   else: push the card id
  // }
  if (selected.length === 1) {
    if (id === selected[0]) {
      console.log("same one clicked.. doing nothing", selected);
      return false;
    } else {
      selected = [...selected, id];
      console.log("adding second card:", selected);
      return selected;
    }
  }
  return false;
};

export default component$(() => {
  const appStore = useContext(AppContext);
  const boardRef = useSignal<HTMLDivElement>();

  const resizeBoard = $((width?: number, height?: number) => {
    // if (width) appStore.boardLayout.width = width;
    const boardWidth = width || boardRef.value?.offsetWidth || 0;
    const boardHeight = height || boardRef.value?.offsetHeight || 0;
    // const boardWidth = boardRef.value?.offsetWidth  || 0;
    // const boardHeight = boardRef.value?.offsetHeight || 0;
    const boardArea = boardWidth * boardHeight;

    const maxAreaPerCard = boardArea / appStore.settings.deck.size; // to get approx cols/rows

    //maxH =
    /*
     * width = height * CARD_RATIO
     * area = height * (height * CARD_RATIO)
     * area = h * h * ratio === h^2 * ratio
     * area / ratio = h^2
     * sqrt(area / ratio) = h
     *
     * */

    // // height first approach
    // const maxHeightPerCard = Math.sqrt(maxAreaPerCard / CARD_RATIO); // get height from area
    // const rows = Math.ceil(boardHeight / maxHeightPerCard); // round up to add a row for the remainder cards
    //
    // const newCardHeight = boardHeight / rows;
    // const newCardWidth = newCardHeight * CARD_RATIO;
    //
    // const columns = Math.ceil(appStore.settings.deck.size / rows);

    // width first approach works better
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
      appStore.game.successfulPairs = [...appStore.game.successfulPairs, pair];

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

  const handleClickBoard = $((e: QwikMouseEvent) => {
    // console.log("clicked board:", { event: e, target: e.target });
    const isCardFlipped = appStore.game.flippedCardId !== -1;
    // attempt to get the card id if click is on a card
    const clickedId = Number((e.target as HTMLElement)?.dataset?.id) || false;
    const isClickedOnCard = !!clickedId;

    switch (true) {
      case isCardFlipped:
        {
          if (appStore.game.selectedCardIds.length === 2) {
            handleAddToSuccessfulPairsIfMatching();
          } // else ?
          appStore.game.flippedCardId = -1;
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

          const selected = handleSelectCard(
            [...appStore.game.selectedCardIds],
            cardId
          );
          if (!!selected) {
            // flip our card
            appStore.game.selectedCardIds = selected;
            appStore.game.flippedCardId = cardId;
          }
        }
        break;
    }
  });

  useOnWindow(
    "resize",
    $((e) => {
      if (appStore.boardLayout.isLocked) return;

      const width = (e.target as Window).innerWidth;
      console.log("resize:", { e, width });

      // make sure window width (minus padding) is passed in, to fix resizing occasional issue
      resizeBoard(width - 32);
    })
  );

  // track deck size changes to adjust board
  useTask$(async (taskCtx) => {
    taskCtx.track(() => appStore.settings.deck.size);
    if (appStore.settings.deck.isLocked) {
      return;
    }
    appStore.game.isLoading = true;
    // appStore.game.cards = v3GenerateCards(appStore.settings.deck.size);
    let cards: DeckOfCardsApi_Card[] | undefined = [];
    try {
      cards = await getNewCards(appStore.settings.deck.size);
    } catch (err) {
      console.log("card API error:", { err });
    }

    if (cards !== undefined && cards.length > 0) {
      appStore.game.cards = formatCards(cards);
    } else {
      // backup, in case our api fails to fetch
      appStore.game.cards = v3GenerateCards(appStore.settings.deck.size);
      console.log("-- defaulting to old cards:", {
        cards: appStore.game.cards,
      });
    }

    appStore.shuffleCardPositions();

    // reset stats
    appStore.game.selectedCardIds = [];
    appStore.game.flippedCardId = -1;
    appStore.game.mismatchPairs = [];
    appStore.game.successfulPairs = [];
    appStore.game.isLoading = false;

    if (appStore.boardLayout.isLocked) {
      return;
    }
    resizeBoard();
  });

  // calculate board on mount
  useVisibleTask$(() => {
    console.log("board useVisibleTask");
    resizeBoard();
  });

  return (
    <>
      <div
        class="grid max-w-full"
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
          <V3Card card={card} key={card.id}/>
        ))}
      </div>
    </>
  );
});

// alternate way to handle positioning:
// flex container
// cards dynamic sizing
// when card is removed, need to leave a "ghost" slot to take up the space (or else the cards will slide up to fill in slots)
