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
