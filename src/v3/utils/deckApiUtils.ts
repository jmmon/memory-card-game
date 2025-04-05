/*
 * Not really used anymore.
 * Before I was fetching on app startup, but that is unnecessary
 * Now I hardcoded the cards, based off this API (and other SVG card images)
 *
 * */

import type { iCard } from "~/v3/types/types";
import deckUtils from "./deckUtils";

const PARTIAL_DECK_API = "https://deckofcardsapi.com/api/deck/new/?cards=";
export const IMAGE_TYPE = "png";

export const deckCardsDrawApi = {
  base: "https://deckofcardsapi.com/api/deck/",
  remainder: "/draw/?count=",
  generate: function (
    this: { base: string; remainder: string; generate: any },
    deckId: string,
    cardCount: number,
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

export const deckOfCardsIds = buildCardIdsArray(deckUtils.FULL_DECK_COUNT);

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
      deckCardsDrawApi.generate(deckJson.deck_id, cardCount),
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
  const outputCards: iCard[] = [];
  for (let i = 0; i < cards.length / 2; i++) {
    const num = i * 2;
    const thisCard1 = cards[num];
    const thisCard2 = cards[num + 1];

    const thisId = deckUtils.genId();
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

// not used anymore
export const fetchAndFormatDeck = async () => {
  console.log("fetching cards...");
  const cards = await getCardsFromApi(deckUtils.FULL_DECK_COUNT);

  if (cards === undefined || cards.length === 0) {
    const deck = deckUtils.v3GenerateDeck();
    console.log("...failed, returning v3 cards");
    return { deck, type: "v3" };
  }

  console.log(`fetched!\nformatting cards...`);
  const formatted = formatCards(cards);
  console.log("done!", { formatted: formatted });

  return { deck: formatted, type: "api" };
};
