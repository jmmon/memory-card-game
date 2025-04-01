// import crypto from "node:crypto";
import dbService from "./db.service";
import { server$ } from "@builder.io/qwik-city";
import type { NewScore } from "../db/types";
import CryptoJS from "crypto-js";

let timeout: ReturnType<typeof setTimeout> | null = null;
// const delay = (ms: number) =>
//   new Promise((resolve) => (timeout = setTimeout(resolve, ms)));

const DEFAULT_HASH_LENGTH_BYTES = 32;

const stringToHash = (string: string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  hash = hash < 0 ? hash * -1 : hash;

  return hash;
};

const numberToString = (number: number) => {
  let stringNum = String(number);
  let string = "";
  while (stringNum.length > 1) {
    const thisChar = String.fromCharCode(Number(stringNum.slice(-2)));
    stringNum = stringNum.slice(0, -2);
    string += thisChar;
  }
  return string;
};

const stringToColor = (
  string: string,
  saturation = { min: 20, max: 80 },
  lightness = { min: 30, max: 80 },
) => {
  // max unique colors: 360 * (saturation.max - saturation.min) * (lightness.max - lightness.min)
  // 360 * 80 * 60 = 1_728_000

  const hash = stringToHash(string);

  const satHash = stringToHash(numberToString(hash));
  const lightHash = stringToHash(numberToString(satHash + hash));

  const satPercent = satHash % 100;
  const lightPercent = lightHash % 100;

  const hue = hash % 360;
  const sat = Math.round(
    saturation.min +
      (Number(satPercent) * (saturation.max - saturation.min)) / 100,
  );
  const light = Math.round(
    lightness.min +
      (Number(lightPercent) * (lightness.max - lightness.min)) / 100,
  );

  // console.log({ satPercent, lightPercent, hue, sat, light });

  return `hsla(${hue}, ${sat}%, ${light}%, 1)`;
};

export const getRandomBytes = (bytes = DEFAULT_HASH_LENGTH_BYTES) => {
  return CryptoJS.lib.WordArray.random(bytes).toString(
    CryptoJS.enc.Hex,
  ) as string;
  // return (Math.random() * 10 ** bytes).toString(16);
  // return crypto.randomBytes(bytes).toString("hex");
};

const ACode = 65;
const ZCode = 90;
const getRandomInitials = () => {
  return String.fromCharCode(
    ...Array(3)
      .fill(null)
      .map(() => Math.floor(Math.random() * (ZCode - ACode + 1)) + ACode),
  );
};

/**
 *0001110110111000001000000000010011100110011001111110101001010111110001011010001100110010010011000011011111101100101101011010110111110010010011110111000000001110001011011011010000000110011000001111101111011111000101000010100001100110011001100111100000011110
 *
 * */
// const getRandomMirroredPixels = () => {
//   const dimensions = 16;
//   const pixelsHalfCount = dimensions * (dimensions / 2);
//   const halfPixels = Array(pixelsHalfCount)
//     .fill(0)
//     .map(() => (Math.random() > 0.5 ? 1 : 0));
//
//   const resultPixelsArray = [];
//   for (let i = 0; i < pixelsHalfCount; i += pixelsHalfCount / dimensions) {
//     const thisSlice = halfPixels.slice(i, i + pixelsHalfCount / dimensions);
//     const forward = thisSlice.join("");
//     const reversed = [...thisSlice].reverse().join("");
//     const combined = forward + reversed;
//     // console.log({ thisSlice, forward, reversed });
//     // console.log({ combined });
//     resultPixelsArray.push(combined);
//   }
//
//   return resultPixelsArray.join("");
// };

const generateHalfPixels = (halfCols: number = 32, rows: number = 64) => {
  const halfPixels = Array(halfCols * rows)
    .fill(0)
    .map(() => (Math.random() > 0.5 ? 1 : 0));
  return halfPixels.join("");
};

const PIXEL_AVATAR_ROWS = 16;
const PIXEL_AVATAR_COLS = 16;
const PIXEL_AVATAR_HALF_COLS = PIXEL_AVATAR_COLS / 2;

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
  const initials = getRandomInitials();
  const halfPixels = generateHalfPixels(
    PIXEL_AVATAR_HALF_COLS,
    PIXEL_AVATAR_ROWS,
  );
  const newScore: NewScore = {
    createdAt: generateRandomMsWithinRange(),
    deckSize,
    gameTimeDs: generateRandomGameTimeDs(deckSize), // decaseconds
    mismatches: generateRandomMismatches(deckSize),
    userId: getRandomBytes(),
    initials,
    pairs: deckSize / 2,
    color: stringToColor(initials),
    // pixelData: pixels,
    pixelData: `${PIXEL_AVATAR_COLS}x${PIXEL_AVATAR_ROWS}:${halfPixels}`,
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

      const newScore = await dbService.saveNewScore(newScoreData);
      newScore;
      // console.log("\nsaved new score:", JSON.stringify({ newScore }));

      // await delay(20);
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
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

    // console.log(
    //   "\n" +
    //     (
    //       await Promise.all([
    //         dbService.scores.getAll(),
    //         dbService.scoreCounts.getAll(),
    //       ])
    //     )
    //       .map((listPromise) =>
    //         listPromise.map((item) => JSON.stringify(item)).join("\n"),
    //       )
    //       .join("\n\n------===------\n\n"),
    // );
  } catch (err) {
    console.log(err);
  }
};

export default server$(function (data: RunSeedData) {
  return runSeed(data);
});
