import type { Card } from "../types/types";

const FULL_DECK_COUNT = 52;

// generates 5 random numbers and concats them as a string
const genId = (length = 5) =>
  new Array(length)
    .fill(0)
    .map((_, i) => {
      const num = Math.floor(Math.random() * 10);
      // for first digit, make sure it's not 0
      return i === 0 ? num || 1 : num;
    })
    .join("");

//backup generator
function v3GenerateDeck(total: number = FULL_DECK_COUNT) {
  const unshuffledCards: Card[] = [];
  // build cards, pair by pair
  for (let i = 0; i < total / 2; i++) {
    const thisId = genId();
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
}

// this shuffles indices into the remaining array
function v3Shuffle_FY_algo<T>(_array: T[]): T[] {
  const array = [..._array];
  // walk backward
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

function refreshPairsId(pair: [Card, Card]) {
  const newId = genId();
  const id = Number(newId + "0");
  const pairId = Number(newId + "1");
  return pair.map((card, i) => ({
    ...card,
    id: i === 0 ? id : pairId,
    pairId: i === 0 ? pairId : id,
  })) as [Card, Card];
}

function buildArrOfPairs(fullDeck: Card[]) {
  const pairs = [];
  for (let i = 0; i < fullDeck.length; i += 2) {
    const thisPair = [fullDeck[i], fullDeck[i + 1]];
    pairs.push(thisPair);
  }
  return pairs as Array<[Card, Card]>;
}

function unbuildArrOfPairs(arrOfPairs: Array<[Card, Card]>) {
  const deck = [];
  for (let i = 0; i < arrOfPairs.length; i++) {
    const thisPair = arrOfPairs[i];
    deck.push(thisPair[0], thisPair[1]);
  }
  return deck;
}

function shuffleDeckAndRefreshIds(fullDeck: Card[]) {
  const pairs = buildArrOfPairs(fullDeck);

  // refresh card ids between games, hopefully fixes the render issue
  // of cards missing after game reset
  const withRefreshedIds = pairs.map((pair) => refreshPairsId(pair));

  // console.log("fn shuffleByPairs:", { deck, pairs });

  // shuffle the array of pairs
  const shuffledDeckOfPairs = v3Shuffle_FY_algo(withRefreshedIds);
  const shuffledPairs = unbuildArrOfPairs(shuffledDeckOfPairs);
  // console.log({ shuffledDeckOfPairs, shuffledPairs });

  return shuffledPairs;
}

/*
 * assign new random positions to deck of cards, and sort  by position
 * */
function shuffleCardPositions(cards: Card[]) {
  const randomOrder = v3Shuffle_FY_algo(
    new Array(cards.length).fill(0).map((_, i) => i)
  );

  const isFirstShuffle =
    cards.filter((c) => c.position === 0).length === cards.length;

  return cards.map((card, i) => ({
    ...card,
    prevPosition: isFirstShuffle ? null : card.position,
    position: randomOrder[i],
  }));
}

const deckUtils = {
  shuffleCardPositions,
  shuffleDeckAndRefreshIds,
  v3Shuffle_FY_algo,
  genId,
  v3GenerateDeck,
  FULL_DECK_COUNT,
};

export default deckUtils;
