// i want to convert the old style which has total counts for each entry
// into the new style which has only differences of counts for each entry
//
// need to go through from last to first
// and take the (total) counts from (all) previous and subtract from current entry
//
//
// e.g. mismatches for 10 games: original:
// {
//  "0": 8,   // two scored a 0, so 8 are worse
//  "1": 7,   // one scored a 1, so 7 are worse
//  "2": 6,   // one scored a 2, so 6 are worse
//                // none scored a 3, so there's no entry
//  "4": 4    // two scored a 4 so there's 4 worse
//  "6": 0    // four scored a 6 so that's all 10, and 0 scored worse
//  }
//
//  new style: showing only the differences for 10 games
// {
//  "0": 1,   // 10 is the total, and two games scored a 0, so 10 - 2 - (the sum of previous === 7) => 1
//  "1": 1,   // entry #0 has a 1, so one score scored a 1
//  "2": 2,   // entry #1 has a 1, so one score scored a 2
//                // none scored a 3, so there's no entry
//  "4": 4    // entry #2 has a 2, so two scores scored a 4
//  "6": 0    // entry #4 has a 4, so four scores scored a 6
//  }
//
//  Looks like to convert, I need to simply take current:value and subtract next:value from it
//  e.g. 
//  8 - 7 = 1, 
//  7 - 6 = 1,
//  6 - 4 = 2,
//  4 - 0 - 4

const convertLessThanOurScoreObjToV2 = (obj) => {
  const alreadySortedEntries = Object.entries(obj).map(([k, v]) => [Number(k), v]);
  let i = 0;
  let [currentScore, currentCount] = alreadySortedEntries[i];
  let [nextScore, nextCount] = alreadySortedEntries[i + 1];

  const newMap = {};

  // doesn't handle 1 length case... but that's ok for testing
  while (i < alreadySortedEntries.length) {
    const newCount = currentCount - nextCount; // subtract next from current
    newMap[currentScore] = newCount; // set that for our new value

    i++;
    [ currentScore, currentCount ] = [nextScore, nextCount]; // save our new current
    [nextScore, nextCount] = alreadySortedEntries[i + 1] ?? [undefined, 0]; // save our new next, or default in case it's the last item
  }

  return newMap;
};

const total = 10_000;

const oldMap = {"0": 1, "1": 0};




const newMap = convertLessThanOurScoreObjToV2(oldMap);
console.log({newMap});
const firstItem = Object.entries(oldMap)[0][0];
const sumOfValues = Object.values(newMap).reduce((sum, cur) => sum + cur, 0);
console.assert(total - oldMap[firstItem] === total - sumOfValues, `sum of values is wrong: newSum: ${sumOfValues}, oldSum: ${oldMap[firstItem]}`);

console.log(JSON.stringify(newMap));





// TODO: set up reverse conversion for the percentile calculations
// that means it also has to be efficient...
// or just ditch this idea for now

const convertLessThanOurScoreObjToV1 = (obj) => {
  // const alreadySortedEntries = Object.entries(obj).map(([k, v]) => [Number(k), v]);
  // let i = 0;
  // let [currentScore, currentCount] = alreadySortedEntries[i];
  // let [nextScore, nextCount] = alreadySortedEntries[i + 1];
  //
  // const newMap = {};
  //
  // // doesn't handle 1 length case... but that's ok for testing
  // while (i < alreadySortedEntries.length) {
  //   const newCount = currentCount - nextCount; // subtract next from current
  //   newMap[currentScore] = newCount; // set that for our new value
  //
  //   i++;
  //   [ currentScore, currentCount ] = [nextScore, nextCount]; // save our new current
  //   [nextScore, nextCount] = alreadySortedEntries[i + 1] ?? [undefined, 0]; // save our new next, or default in case it's the last item
  // }
  //
  // return newMap;
};

// const total = 10_000;
//
//
//
//
//
// const newMap = convertLessThanOurScoreObjToV2(oldMap);
// console.log({newMap});
// const firstItem = Object.entries(oldMap)[0][0];
// const sumOfValues = Object.values(newMap).reduce((sum, cur) => sum + cur, 0);
// console.assert(total - oldMap[firstItem] === total - sumOfValues, `sum of values is wrong: newSum: ${sumOfValues}, oldSum: ${oldMap[firstItem]}`);
//
// console.log(JSON.stringify(newMap));






