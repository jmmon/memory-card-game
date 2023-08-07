import { V3Card } from "../v3-game/v3-game";

const genId = (length = 5) => {
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
