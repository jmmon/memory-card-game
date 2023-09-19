import crypto from "node:crypto";
import scoreService from "./score.service";
import serverDbService from "./db.service";
import { server$ } from "@builder.io/qwik-city";
import scoreCountsService from "./scoreCounts.service";
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  lightness = { min: 30, max: 80 }
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
      (Number(satPercent) * (saturation.max - saturation.min)) / 100
  );
  const light = Math.round(
    lightness.min +
      (Number(lightPercent) * (lightness.max - lightness.min)) / 100
  );

  // console.log({ satPercent, lightPercent, hue, sat, light });

  return `hsla(${hue}, ${sat}%, ${light}%, 1)`;
};

const getRandomBytes = (bytes = DEFAULT_HASH_LENGTH_BYTES) => {
  return crypto.randomBytes(bytes).toString("hex");
};

const ACode = 65;
const ZCode = 90;
const getRandomInitials = () => {
  return String.fromCharCode(
    ...Array(3)
      .fill(null)
      .map(() => Math.floor(Math.random() * (ZCode - ACode + 1)) + ACode)
  );
};

const getRandomMirroredPixels = () => {
  const dimensions = 10;
  const pixelsHalfCount = 50;
  const halfPixels = Array(pixelsHalfCount)
    .fill(0)
    .map(() => (Math.random() > 0.5 ? 1 : 0));

  let resultPixelsArray = [];
  for (let i = 0; i < pixelsHalfCount; i += pixelsHalfCount / dimensions) {
    const thisSlice = halfPixels.slice(i, i + pixelsHalfCount / dimensions);
    const forward = thisSlice.join("");
    const reversed = [...thisSlice].reverse().join("");
    const combined = forward + reversed;
    // console.log({ thisSlice, forward, reversed });
    // console.log({ combined });
    resultPixelsArray.push(combined);
  }

  return resultPixelsArray.join("");
};

const generateScore = (deckSize: number) => {
  const userId = getRandomBytes();
  const initials = getRandomInitials();
  const pixels = getRandomMirroredPixels();
  const mismatches = Math.max(
    0,
    Math.round(
      2 * (deckSize / 6) +
        (Math.random() > 0.5 ? 1 : -1) * (Math.random() * (deckSize / 2))
    )
  );

  const newScore = {
    deckSize,
    gameTime: `${
      deckSize * 1000 + Math.round(Math.random() * 1000)*100
    } millisecond`,
    mismatches,
    userId,
    initials,
    pairs: deckSize / 2,
    color: stringToColor(initials),
    pixels,
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
    console.log("deckSize:", deckSize);
    for (let i = 0; i < scoresPerDeckSize; i++) {
      const newScore = generateScore(deckSize);
      // console.log(i + ": " + JSON.stringify({ newScore }));

      const newScorePromise = await serverDbService.saveNewScore(newScore);
      console.log("saved new score:", JSON.stringify({ newScorePromise }));
      await delay(100);
    }
  }
};

const runSeed = async function ({
  totalDeckSizes = 2,
  scoresPerDeckSize = 7,
}: {
  totalDeckSizes: number;
  scoresPerDeckSize: number;
}) {
  try {
    const minDeckSize = 6;
    const maxDeckSize = 52;
    const maxDecksAvailable = (maxDeckSize - minDeckSize) / 2 + 1; // e.g. 24
    const stepBetweenDeckSizes = Math.floor(maxDecksAvailable / totalDeckSizes) * 2;

    await serverDbService.clearData();
    await createManyScores({
      minDeckSize,
      maxDeckSize,
      stepBetweenDeckSizes, // e.g. 12
      scoresPerDeckSize,
    });


    console.log(
      '\n' +
      (await Promise.all([scoreService.getAll(), scoreCountsService.getAll()]))
        .map((listPromise) =>
          listPromise.map((item) => JSON.stringify(item)).join("\n")
        )
        .join("\n\n------===------\n\n")
    );
  } catch (err) {
    console.log(err);
  }
};

export default server$(runSeed);
