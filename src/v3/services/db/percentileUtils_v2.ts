import { Score } from "~/v3/db/schemas/types";
import { LessThanOurScoreObj } from "~/v3/types/types";

const OLD_updateWorseThanOurScoreMap = (
  score: Score,
  total: number,
  oldJson: string,
  key: "gameTimeDs" | "mismatches",
) => {
  const newLessThanOurScoreJson: LessThanOurScoreObj = {};
  const sortedEntries = Object.entries(
    JSON.parse(oldJson) as LessThanOurScoreObj,
  )
    .map(([k, v]) => [Number(k), v])
    .sort(([scoreA], [scoreB]) => scoreA - scoreB);

  let nextBetterCount = total;
  let isNeedToInsert = true;

  for (let i = 0; i < sortedEntries.length; i++) {
    const [thisScore, thisLessThanCount] = sortedEntries[i];

    if (score[key] > thisScore) {
      newLessThanOurScoreJson[thisScore] = thisLessThanCount + 1;
      nextBetterCount = thisLessThanCount;
    } else if (score[key] < thisScore) {
      // do nothing
      newLessThanOurScoreJson[thisScore] = thisLessThanCount;
    } else {
      // equal
      isNeedToInsert = false;
      newLessThanOurScoreJson[thisScore] = thisLessThanCount;
    }
  }

  if (isNeedToInsert) {
    newLessThanOurScoreJson[score[key]] = nextBetterCount;
    const final = Object.entries(newLessThanOurScoreJson)
      .map(([k, v]) => [Number(k), v])
      .sort(([scoreA], [scoreB]) => scoreA - scoreB);
    return JSON.stringify(Object.fromEntries(final));
  }

  return JSON.stringify(newLessThanOurScoreJson);
};
OLD_updateWorseThanOurScoreMap;





// TODO:
// finish more efficient version
// - don't really need to go through all, can go through only the ones WORSE than us
// - can reuse the entries that are better than our score
//
// also, could change how we calculate scores:
// - only increment the next highest/worse count
// - then when calculating scores, would need to go over all worse-than and total them
//   - then calculate percentile from that total
// - WARN: this will mean totals must be calculated from the worst up
//
//
// also probably don't need to sort again below if it stays in order
// - would need to insert in the loop so it's in the correct place
// this is the update function, so if we maintain order in here during updates, then
// we don't need to ever sort the json
//
//  can I just splice it in? still might need the total "worse" counts so I could know the correct counts I think?
//
//  NOTE:
//  walk the array from worst to best scores [last to first], counting the totals worse so far ?? or maybe not need the totals
//  find the index where mine will fit
//  NOTE:
//  if it's the BEST score, need the total to calculate e.g. total - 1, since mine is the only best
//  ->
//  if it's the WORST score, grab the next better score and increment it, nothing else changes
//  if it's not a new entry, grab the next better score and increment it, nothing else changes
//  ->
//  if it's a new entry and not the best, 
//  - have to grab the next BETTER score and use it for my score,
//  - and next better score count becomes 1, since mine is the only one score directly worse
//
//



const NEW_updateWorseThanOurScoreMap = (
  score: Score,
  total: number,
  oldJson: string,
  key: "gameTimeDs" | "mismatches",
) => {
  const newLessThanOurScoreJson: LessThanOurScoreObj = {};
  const sortedEntries = Object.entries(
    JSON.parse(oldJson) as LessThanOurScoreObj,
  )
    .map(([k, v]) => [Number(k), v])
    .sort(([scoreA], [scoreB]) => scoreA - scoreB);

  let nextBetterCount = total;
  let isNeedToInsert = true;

  for (let i = 0; i < sortedEntries.length; i++) {
    const [thisScore, thisLessThanCount] = sortedEntries[i];

    if (score[key] > thisScore) {
      newLessThanOurScoreJson[thisScore] = thisLessThanCount + 1;
      nextBetterCount = thisLessThanCount;
    } else if (score[key] < thisScore) {
      // do nothing
      newLessThanOurScoreJson[thisScore] = thisLessThanCount;
    } else {
      // equal
      isNeedToInsert = false;
      newLessThanOurScoreJson[thisScore] = thisLessThanCount;
    }
  }

  if (isNeedToInsert) {
    newLessThanOurScoreJson[score[key]] = nextBetterCount;
    const final = Object.entries(newLessThanOurScoreJson)
      .map(([k, v]) => [Number(k), v])
      .sort(([scoreA], [scoreB]) => scoreA - scoreB);
    return JSON.stringify(Object.fromEntries(final));
  }

  return JSON.stringify(newLessThanOurScoreJson);
};






//
// const updateWorseThanOurScoreJson2 = (
//   score: Score,
//   total: number,
//   oldJson: LessThanOurScoreObj,
//   key: "gameTimeDs" | "mismatches",
// ) => {
//   const newLessThanOurScoreJson: LessThanOurScoreObj = {};
//   const sortedEntries = Object.entries(oldJson)
//     .map(([k, v]) => [Number(k), v])
//
//   const ourScore = score[key];
//
//   // handle 1 length case:
//   if (sortedEntries.length === 1) {
//     const [currentScore] = sortedEntries[0];
//     if (ourScore > currentScore) {
//       // ours is higher (worse)
//       // so their number should increase
//       // and we should have 0
//       // and theirs should be first
//       newLessThanOurScoreJson[currentScore] = 1;
//       newLessThanOurScoreJson[ourScore] = 0;
//       // nextBetterCount = currentLessThanCount;
//     } else {
//       if (ourScore < currentScore) {
//         // ours is better so we have 1 that is worse
//         newLessThanOurScoreJson[ourScore] = 1;
//       }
//       // old score (or equal score) gets appended next, with 0
//       // (it's either worse than ours or equal to ours)
//       newLessThanOurScoreJson[currentScore] = 0;
//     }
//     return newLessThanOurScoreJson;
//   }
//
//   let nextBetterCount = total;
//   let isNeedToInsert = true;
//
//   // TODO: handle >1 length case
//   // grab current and previous datas
//   // increment only the next better score (it is higher than us)
//   // - that will let us reduce the size of json, would then need to total the counts for the percentiles
//   // start from lowest score (best score)
//   // once we find a score that is worse or equal, we know where our score stands
//   // - then increment the prev score's counts by 1 to indicate there is now one more worse than it
//   // when breaking, use the index to find where to splice from the untouched part to patch it on afterwards
//
//   // maybe just try to use splice???
//   // indexOf to find index where score matches
//   // then go back one index to find next better (lower) score to increment it
//   // or if needed, splice in our new record for our new score if it didn't exist
//
//   // TODO: handle case where ours is the highest score, aka better than [0]
//
//   const [bestScore, bestCount] = sortedEntries[0];
//   if (ourScore < bestScore) { // ours is the best, so need to get our total
//     // need to determine how many scores are in the next worse score
//     // i think sum up all scores from [1] to the end, and subtract from total
//     const ourTotal = total - sortedEntries.slice(1).reduce((accum, [_, count]) => accum + count, 0);
//
//     //then can append the entire array, or unshift ours and return the entire thing
//
//     sortedEntries.unshift([ourScore, ourTotal]);
//     return sortedEntries;
//   }
//
//   // maybe should walk backwards through the array?, so then I can always have the total
//   // then it's simple to find out the next counts
//
//   let i = 1; // start at 1 and 0 for cur/prev
//   
//   while(i < sortedEntries.length) {
//     const [prevScore, prevCount] = sortedEntries[i - 1];
//     const [curScore, curCount] = sortedEntries[i];
//
//     console.assert(prevScore < curScore, "it's not sorted properly");
//     //if (ourScore < curScore && ourScore < prevScore) {
//     //  // ours is best
//     //  newLessThanOurScoresObj[ourScore] = total - (sum of all below);
//     //}
//
//     if (ourScore > curScore && ourScore > prevScore) {
//       // do nothing? aka insert same value
//       newLessThanOurScoreObj[curScore] = curCount;
//
//     } else if (ourScore === curScore && ourScore > prevScore) {
//       // prev score is better than ours, and cur score is the same
//       // increment curScore
//       
//
//     } else if (ourScore > curScore && ourScore < prevScore) {
//       // we are in between, our score is better than prevScore but worse than curScore
//       // curScore has to increment
//
//     } else {
//       // TODO:
//
//       break; // break the loop since nothing else to do
//     }
//
//
//     i++;
//   }
//
//   // TODO:
//   // loop will break , and we can combine the untouched part and the modified part and it should keep in same order
//
//   const priorHalf = newLessThanOurScoreJson.push([score[key], nextBetterCount]);
//   const latterHalf = sortedEntries.slice(i);
//
//   return priorHalf.concat(latterHalf);
//
// }
//
//




