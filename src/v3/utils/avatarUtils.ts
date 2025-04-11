import GAME from "../constants/game";
import { getHexHashString, hexCharToBase, numberToString, stringToHash } from "./hashUtils";

/**
 * Generates the color from the initials
 * */
export const stringToColor = (
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


//
/**
 * calculates base needed to achieve the target string length
 * by reducing the base of the hex string until we have enough digits
 *
 * @param hex - input string to generate the base
 * @param targetMinimumStringLength - the half of pixels required
 * @return the new base
 */
function calculateBaseChange(hex: string, targetMinimumStringLength: number) {
  const initialBase = 16; // the base of hex numbers
  let toDivideBaseBy = Math.ceil(targetMinimumStringLength / hex.length);
  let newBase = initialBase;

  while (toDivideBaseBy > 1) {
    if (newBase === 2) {
      throw new Error(
        `too long: { targetMinimumStringLength: ${targetMinimumStringLength}, hex: ${hex}, toDivideBaseBy: ${toDivideBaseBy} }`,
      );
    }
    newBase /= 2;
    toDivideBaseBy /= 2;
  }

  return newBase;
}

export function hexHash2BaseOfLength(hex: string, len: number) {
  const newBase = calculateBaseChange(hex, len);
  // calcBaseChange(hex, len);

  return {
    rebasedHash: hex
      .split("")
      .map((hexChar) => hexCharToBase(hexChar, newBase))
      .join(""),
    base: newBase,
  };
}

export function getPixels(
  hash: string,
  cols: number,
  rows: number,
  base: number = 2,
) {
  // convert 40char hash to 4 * 7 (mirrored for 7 * 7) matrix, 28bits
  let pixels = "";

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const halfway = Math.ceil(cols / 2);
      const J = j >= halfway ? cols - 1 - j : j;
      const charFromHash = hash.charAt(i * halfway + J);
      if (base === 2) {
        pixels += charFromHash;
      } else {
        const shouldFill = parseInt(charFromHash, base) % 2;
        pixels += shouldFill ? "0" : "1";
      }
    }
  }

  return pixels;
}

export function mirrorPixels(cols: number, rows: number, halfPixels: string) {
  let pixels = "";

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const halfway = Math.ceil(cols / 2);
      const J = j >= halfway ? cols - 1 - j : j;
      const charFromHash = halfPixels.charAt(i * halfway + J);
      pixels += charFromHash;
    }
  }

  return pixels;
}

export async function calculatePixelData(
  text: string,
  cols: number,
  rows: number,
  saturation: { min: number; max: number },
  lightness: { min: number; max: number },
) {
  const hash = await getHexHashString(text);

  const allButLast3 = hash.slice(0, -3);
  const requiredLength = rows * Math.ceil(cols / 2);
  const { rebasedHash, base } = hexHash2BaseOfLength(
    allButLast3,
    requiredLength,
  );

  const pixels = getPixels(rebasedHash, cols, rows, base);

  const color = stringToColor(hash.slice(-3), saturation, lightness);

  const data = `${pixels}:${color}`;
  // console.log({ data });
  return data;
}

export async function calculateOnlyPixels(
  hash: string,
  cols: number,
  rows: number,
) {
  // console.log("calculateOnlyPixels:", { hash });
  const requiredLength = rows * Math.ceil(cols / 2);
  const { rebasedHash, base } = hexHash2BaseOfLength(hash, requiredLength);

  return getPixels(rebasedHash, cols, rows, base);
}

export async function calculateOnlyColor(
  text: string,
  saturation: { min: number; max: number } = GAME.DEFAULT_COLOR_OPTIONS
    .saturation,
  lightness: { min: number; max: number } = GAME.DEFAULT_COLOR_OPTIONS
    .lightness,
) {
  const hash = await getHexHashString(text);
  // console.log("calculating color only for text:", text, hash);
  return stringToColor(hash, saturation, lightness);
}
