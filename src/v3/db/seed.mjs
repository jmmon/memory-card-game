import { sql } from "drizzle-orm";
import {
  integer,
  interval,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import crypto from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// const connectionString = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const connectionString =
  "postgresql://postgres:postgres@localhost:5432/memory-card-game-scores";

const client = postgres(connectionString);
const db = drizzle(client);

const DEFAULT_HASH_LENGTH_BYTES = 32;

export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("createdAt", { withTimezone: true }).default(sql`now()`),
  deckSize: integer("deckSize"),
  gameTime: interval("gameTime", { precision: 6 }),
  mismatches: integer("mismatches"),
  pairs: integer("pairs"),
  userId: varchar("userId", { length: 64 }), // some uuid, hashed value of an identifier/hash
  initials: varchar("initials", { length: 32 }), // some optional inputted string??
  color: varchar("color", { length: 32 }), // hsl(xxx, xxx%, xxx%)
  pixels: varchar("pixels", { length: 256 }), // binary
});

const stringToHash = (string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  hash = hash < 0 ? hash * -1 : hash;

  return hash;
};

const numberToString = (number) => {
  number = String(number);
  let string = "";
  while (number.length > 1) {
    const thisChar = String.fromCharCode(number.slice(-2));
    number = number.slice(0, -2);
    string += thisChar;
  }
  return string;
};

const stringToColor = (
  string,
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

(async function () {
  const createScore = (data) => {
    if (!data.createdAt) data.createdAt = new Date();
    return db.insert(scores).values(data).returning();
  };
  const getAllScores = () => db.select().from(scores);

  const generateScore = (deckSize) => {
    const userId = getRandomBytes();
    const initials = getRandomInitials();
    const pixels = getRandomMirroredPixels();
    const mismatches = Math.max(
      0,
      Math.round(
        2 ** (deckSize / 6) +
          (Math.random() > 0.5 ? 1 : -1) * (Math.random() * (deckSize / 2))
      )
    );

    const newScore = {
      deckSize,
      gameTime: `${
        deckSize * 1000 + Math.round(Math.random() * 100000)
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

  const createManyScores = ({
    minDeckSize = 6,
    maxDeckSize = 24,
    stepBetweenDeckSizes = 6,
    countPerDeckSize = 9,
  }) => {
    const promises = [];
    for (
      let deckSize = minDeckSize;
      deckSize <= maxDeckSize;
      deckSize += stepBetweenDeckSizes
    ) {
      for (let i = 0; i < countPerDeckSize; i++) {
        const newScore = generateScore(deckSize);
        console.log({ newScore });

        const newScorePromise = createScore(newScore);

        promises.push(newScorePromise);
      }
    }
    return Promise.all(promises);
  };

  try {
    await db.delete(scores);
    await createManyScores({
      minDeckSize: 6,
      maxDeckSize: 52,
      stepBetweenDeckSizes: 4,
      countPerDeckSize: 7,
    });

    console.log(await getAllScores());
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(0);
  }
})()
