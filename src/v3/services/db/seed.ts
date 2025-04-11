// import crypto from "node:crypto";
import { server$ } from "@builder.io/qwik-city";
import type { InsertScore } from "~/v3/db/schemas/types";
import serverDbService from ".";
import { getRandomBytes } from "~/v3/utils/hashUtils";

const ACode = 65;
const ZCode = 90;
const getRandomInitials = () => {
  return String.fromCharCode(
    ...Array(3)
      .fill(null)
      .map(() => Math.floor(Math.random() * (ZCode - ACode + 1)) + ACode),
  );
};

const CREATED_AT_DATE_RANGE_MS = 60 * 60 * 24 * 365 * 1000; // one year
const generateRandomMsWithinRange = (
  rangeMS: number = CREATED_AT_DATE_RANGE_MS,
  end: number = Date.now(),
) => {
  const start = end - rangeMS;
  return new Date(Math.floor(Math.random() * (end - start)) + start).getTime();
};

/**
 * in decaseconds (tenths)
 * */
const generateRandomGameTimeDs = (deckSize: number) =>
  (deckSize * 1000 + Math.round(Math.random() * 1000) * 100) / 100;

const generateRandomMismatches = (deckSize: number) =>
  Math.max(
    0,
    Math.round(
      2 * (deckSize / 6) +
        (Math.random() > 0.5 ? 1 : -1) * (Math.random() * (deckSize / 2)),
    ),
  );

const generateScoreData = (deckSize: number) => {
  const newScore: InsertScore = {
    createdAt: generateRandomMsWithinRange(),
    deckSize,
    gameTimeDs: generateRandomGameTimeDs(deckSize), // decaseconds
    mismatches: generateRandomMismatches(deckSize),
    userId: getRandomBytes(),
    initials: getRandomInitials(),
    pairs: deckSize / 2,
  };
  return newScore;
};

const createManyScores = async ({
  minDeckSize = 6,
  maxDeckSize = 52,
  stepBetweenDeckSizes = 6,
  scoresPerDeckSize = 9,
}) => {
  for (
    let deckSize = minDeckSize;
    deckSize <= maxDeckSize;
    deckSize += stepBetweenDeckSizes
  ) {
    const start = Date.now();
    console.log("starting deckSize:", deckSize);
    for (let i = 0; i < scoresPerDeckSize; i++) {
      const newScoreData = generateScoreData(deckSize);

      await serverDbService.saveNewScore(newScoreData);
    }
    console.log(
      `...DONE with ${deckSize}! ~ ${(Date.now() - start) / 1000} seconds for ${scoresPerDeckSize} scores`,
    );
  }
};

type RunSeedData = {
  totalDeckSizes: number;
  scoresPerDeckSize: number;
};
const runSeed = async function ({
  totalDeckSizes,
  scoresPerDeckSize,
}: RunSeedData) {
  try {
    const minDeckSize = 6;
    const maxDeckSize = 52;
    const maxDecksAvailable = (maxDeckSize - minDeckSize) / 2 + 1; // e.g. 24
    const stepBetweenDeckSizes =
      Math.floor(maxDecksAvailable / totalDeckSizes) * 2;

    await createManyScores({
      minDeckSize,
      maxDeckSize,
      stepBetweenDeckSizes, // e.g. 12
      scoresPerDeckSize,
    });
  } catch (err) {
    console.log(err);
  }
};

export default server$(function (data: RunSeedData) {
  return runSeed(data);
});
