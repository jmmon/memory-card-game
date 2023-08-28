import type { Pair, V3Card } from "../v3-game/v3-game";

export const FULL_DECK_COUNT = 52;
export const IMAGE_TYPE = "png";

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
};

//backup generator
export const v3GenerateCards = (total: number) => {
  const unshuffledCards: V3Card[] = [];
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
      prevPosition: null,
      isMismatched: false,
    };
    const card2 = {
      id: id2,
      text: `card text ${num + 1} b`,
      pairId: id1,
      position: num + 1, // eventually should be a random position
      prevPosition: null,
      isMismatched: false,
    };

    unshuffledCards.push(card1, card2);
  }
  return unshuffledCards;
};

// this shuffles indices into the remaining array
export function v3Shuffle_FY_algo<T>(_array: T[]): T[] {
  // walk backward
  const array = [..._array];
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
}

// const buildPairType = (c1: V3Card, c2: V3Card) => `${c1.id}:${c2.id}`

function buildArrOfPairs(deck: V3Card[]) {
  const pairs = [];
  for (let i = 0; i < deck.length ; i+=2) {
    const thisPair = [deck[i], deck[i + 1]];
    pairs.push(thisPair);
  }
  return pairs;
}

function unbuildArrOfPairs(arrOfPairs: Array<V3Card[]>) {
  const deck = [];
  for (let i = 0; i < arrOfPairs.length; i++) {
    const thisPair = arrOfPairs[i];
    deck.push(thisPair[0], thisPair[1]);
  }
  return deck;
}

export function shuffleByPairs(deck: V3Card[]) {
  const pairs = buildArrOfPairs(deck);
  console.log("fn shuffleByPairs:", { deck, pairs });
  const shuffledDeckOfPairs = v3Shuffle_FY_algo(pairs);
  const shuffledPairs = unbuildArrOfPairs(shuffledDeckOfPairs);
  console.log({ shuffledDeckOfPairs, shuffledPairs });

  return shuffledPairs;
}

/*
 * getCardsArrayFromPairs
 * destructure arrayOfPairs into arrayOfCards
 * */
export const getCardsArrayFromPairs = (arr: Pair[]) => {
  return arr.reduce((accum: number[], cur: Pair) => {
    const [c1, c2] = cur.split(":");
    accum.push(Number(c1), Number(c2));
    return accum;
  }, []);
};

/*
 * assign new random positions to deck of cards, and sort  by position
 * */
export const shuffleCardPositions = (cards: V3Card[]) => {
  const randomOrder = v3Shuffle_FY_algo(
    new Array(cards.length).fill(0).map((_, i) => i)
  );

  return cards
    .map((card, i) => ({
      ...card,
      prevPosition: card.position,
      position: randomOrder[i],
    }))
    .sort((a, b) => a.position - b.position);
};

/*
 * NEW: actual cards from a card API!
 *
 * */

const PARTIAL_DECK_API = "https://deckofcardsapi.com/api/deck/new/?cards=";

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

const CARD_CODES = [
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
};

export const deckOfCardsIds = buildCardIdsArray(FULL_DECK_COUNT);

export const getCardsFromApi = async (cardCount: number) => {
  console.log("fn getCardsFromApi");
  const cards = deckOfCardsIds.slice(0, cardCount);
  const uri = PARTIAL_DECK_API + cards.join(",");
  console.log(`~~ ${uri}`);

  try {
    // get new partial deck
    const response = await fetch(uri);
    const deckJson = (await response.json()) as DeckOfCardsApi_Deck;
    // console.log({ deckJson });

    // draw cardCount cards
    const cardsResponse = await fetch(
      deckCardsDrawApi.generate(deckJson.deck_id, cardCount)
    );
    const drawnCardsJson =
      (await cardsResponse.json()) as DeckOfCardsApi_DeckWithCards;
    // console.log({ drawnCardsJson });

    // return them
    return drawnCardsJson.cards as DeckOfCardsApi_Card[];
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
      prevPosition: null,
      isMismatched: false,
      image: thisCard1.images[IMAGE_TYPE],
    };
    const newCard2 = {
      id: id2,
      text: thisCard2.code,
      pairId: id1,
      position: num + 1,
      prevPosition: null,
      isMismatched: false,
      image: thisCard2.images[IMAGE_TYPE],
    };

    outputCards.push(newCard1, newCard2);
  }
  return outputCards;
};

export const fetchAndFormatDeck = async () => {
  console.log("fetching cards...");
  const cards = await getCardsFromApi(FULL_DECK_COUNT);

  if (cards === undefined || cards.length === 0) {
    const deck = v3GenerateCards(FULL_DECK_COUNT);
    console.log("...failed, returning v3 cards");
    return { deck, type: "v3" };
  }

  console.log(`fetched!\nformatting cards...`);
  const formatted = formatCards(cards);
  console.log("done!", { formatted: formatted });

  return { deck: formatted, type: "api" };
};

export const cardUtils = {
  formatCards,
  getCardsFromApi,
  shuffleCardPositions,
  v3Shuffle_FY_algo,
  v3GenerateCards,
};
