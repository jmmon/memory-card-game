import { V3Card } from "../v3-game/v3-game";

export const IMAGE_TYPE = 'png';

// generates 5 random numbers and concats them as a string
export const genId = (length = 5) => {
    return new Array(length)
      .fill(0)
      .map((_, i) => {
        const num = Math.floor(Math.random() * 10);
        // should prevent 0's from being the first digit, so all nums should be 5 digits
        return i === 0 ? num || 1 : num;
      })
      .join("");
}

export const v3GenerateCards = (total: number) => {
  let unshuffledCards: V3Card[] = [];
  // build cards, pair by pair
  for (let i = 0; i < total / 2; i++) {
    const thisId = genId();
    // const thisId = Math.ceil(Math.random() * 10000);
    const id1 = Number(thisId + "0");
    const id2 = Number(thisId + "1");
    const num = i * 2;

    const card1 = {
      id: id1,
      text: `card text ${num} a`,
      pairId: id2,
      position: num, // eventually should be a random position
      isMismatched: false,
    };
    const card2 = {
      id: id2,
      text: `card text ${num + 1} b`,
      pairId: id1,
      position: num + 1, // eventually should be a random position
      isMismatched: false,
    };

    unshuffledCards.push(card1, card2);
  }
  return unshuffledCards;
};

// this shuffles indices into the remaining array
export function v3Shuffle_FY_algo<T>(_array: T[]): T[] {
  // walk backward
  const array = [ ..._array ];
  for (let i = array.length - 1; i > 0; i--) {
    // pick random index from 'remaining' indices
    const j = Math.floor(Math.random() * (i + 1));

    // swap the current with the target indices
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;

    // swap the two using destructuring
    // [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

/* TODO:
* some sort of shufflePosition algorithm, 
* so I can shuffle the deck with a cool animation! 
*
* opt 1: take the previous array, shuffle it, then map through and select new positions
* hope transition all will cover it
*
* */


export const shuffleCardPositions = (cards: V3Card[]) => {
  const newOrder = v3Shuffle_FY_algo<number>(
    new Array(cards.length).fill(0).map((_, i) => i)
  );
  return cards
    .map((card, i) => ({ ...card, position: newOrder[i] }))
    .sort((a, b) => a.position - b.position);
};





/*
 * NEW: actual cards from a card API!
 *
 * */

const partialDeckApi =
  "https://deckofcardsapi.com/api/deck/new/?cards=";

export const deckCardsDrawApi = {
  base: "https://deckofcardsapi.com/api/deck/",
  remainder: "/draw/?count=",
  generate: function (
    this: { base: string; remainder: string; generate: any },
    deckId: string,
    cardCount: number
  ): string {
    return this.base + deckId + this.remainder + cardCount;
  },
};
export type DeckOfCardsApi_Deck_Base = {
  deck_id: string;
  success: boolean;
  remaining: number;
};
export type DeckOfCardsApi_Deck = DeckOfCardsApi_Deck_Base & {
  shuffled: boolean;
};
export type DeckOfCardsApi_Card = {
  code: string;
  image: string;
  images: {
    svg: string;
    png: string;
  };
  value: string;
  suit: string;
};
export type DeckOfCardsApi_DeckWithCards = DeckOfCardsApi_Deck_Base & {
  cards: DeckOfCardsApi_Card[];
};
export const CARD_CODES = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "J",
  "Q",
  "K",
];

export const buildCardIdsArray = (cardCount: number) => {
  const cards = [];
  for (let i = 0; i < cardCount / 2; i++) {
    const isEven = i % 2 === 0;
    const thisCardCode = CARD_CODES[Math.floor(i / 2)];
    const newCards = [
      `${thisCardCode}${isEven ? "D" : "C"}`,
      `${thisCardCode}${isEven ? "H" : "S"}`,
    ];

    cards.push(...newCards);
  }
  return cards;
}

export const deckOfCardsIds = buildCardIdsArray(52);

export const getNewCards = async (cardCount: number) => {
  const cards = deckOfCardsIds.slice(0, cardCount);
  console.log({cards});

  try {
    // get new partial deck
    const uri = (partialDeckApi + cards.join(","))
    console.log({uri});
    const response = await fetch(uri);
    const deckJson = (await response.json()) as DeckOfCardsApi_Deck;
    console.log({ deckJson });

    // draw cardCount cards
    const cardsResponse = await fetch(
      deckCardsDrawApi.generate(deckJson.deck_id, cardCount)
    );
    const drawnCardsJson =
      (await cardsResponse.json()) as DeckOfCardsApi_DeckWithCards;
    console.log({ drawnCardsJson });

    // return them
    return drawnCardsJson.cards;
  } catch (err) {
    console.log({ err });
  }
};

export const formatCards = (cards: DeckOfCardsApi_Card[]) => {
  const outputCards: V3Card[] = [];
  for (let i = 0; i < cards.length / 2; i++) {
    const num = i * 2;
    const thisCard1 = cards[num];
    const thisCard2 = cards[num + 1];

    const thisId = genId();
    const id1 = Number(thisId + "0");
    const id2 = Number(thisId + "1");

    const newCard1 = {
      id: id1,
      text: thisCard1.code,
      pairId: id2,
      position: num,
      isMismatched: false,
      image: thisCard1.images[IMAGE_TYPE],
    };
    const newCard2 = {
      id: id2,
      text: thisCard2.code,
      pairId: id1,
      position: num + 1,
      isMismatched: false,
      image: thisCard2.images[IMAGE_TYPE],
    };

    outputCards.push(newCard1, newCard2);
  }
  return outputCards;
};
