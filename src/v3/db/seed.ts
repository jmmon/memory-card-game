import {db} from "../db/index";
import {type NewScore, scores} from "../db/schema";


const createScore = (data: NewScore) => db.insert(scores).values(data);
const getAllScores = () => db.select().from(scores);

const createManyScores = (count = 5) => {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(createScore({
      deckSize: 6,
      gameTime: '60000 millisecond',
      mismatches: 2,
      userId: (Math.random() * 1000000).toFixed(0),
      initials: 'joe',
    }))
  }
  for (let i = 0; i < count; i++) {
    promises.push(createScore({
      deckSize: 12,
      gameTime: '60000 millisecond',
      mismatches: 2,
      userId: (Math.random() * 1000000).toFixed(0),
      initials: 'joe',
    }))
  }
  for (let i = 0; i < count; i++) {
    promises.push(createScore({
      deckSize: 18,
      gameTime: '60000 millisecond',
      mismatches: 2,
      userId: (Math.random() * 1000000).toFixed(0),
      initials: 'joe',
    }))
  }
  return Promise.all(promises);
};


(async function () {
  await createManyScores(5);

  console.log(await getAllScores());
})()

