export type Card = {
  id: string; // unique id
  text: string; // content of the card
  position: number; // where it lands in the order of slots on the board
  pairId: string;
};

export const generateCards = (total: number) => {
  let unshuffledCards: Card[] = [];
  // build cards
  for (let i = 0; i < total / 2; i++) {
    // create a pair of cards
    const thisId = new Array(5)
      .fill(0)
      .map((_, i) => {
        const num = Math.floor(Math.random() * 10);
        // should prevent 0's from being the first digit, so all nums should be 5 digits
        return i === 0 ? num || 1 : num;
      })
      .join("");

    // const thisId = Math.ceil(Math.random() * 10000);
    const id1 = (thisId + "0");
    const id2 = (thisId + "1");
    const num = i * 2;

    const card1 = {
      id: id1,
      text: `card text ${num} a`,
      pairId: id2,
      position: num, // eventually should be a random position
    };
    const card2 = {
      id: id2,
      text: `card text ${num + 1} b`,
      pairId: id1,
      position: num + 1, // eventually should be a random position
    };

    unshuffledCards.push(card1, card2);
  }
  return unshuffledCards;

};

export function shuffle1(arr: any[]): any[] {
  return Array(arr.length) // create new array
    .fill(null)
    .map((_, i) => [Math.random(), i]) // map so we have [random, index]
    .sort(([randA], [randB]) => randA - randB) // sort by the random numbers
    .map(([, i], newPos) => ({ ...arr[i], position: newPos })); // match input arr to new arr by index
}

// this shuffles indices into the remaining array
export const shuffle_FY_algo = (_array: Card[]): Card[] => {
  // walk backward
  const array = _array.slice();
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
